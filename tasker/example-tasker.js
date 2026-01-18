/**
 * Tasker 适配器示例
 * 
 * 这个示例展示了如何创建一个自定义的 Tasker 适配器。
 * Tasker 用于连接不同的聊天平台（如 QQ、微信、Telegram 等）。
 * 
 * 主要功能：
 * 1. 连接外部服务（WebSocket、HTTP 等）
 * 2. 接收和发送消息
 * 3. 处理事件（消息、通知、请求等）
 * 4. 消息格式转换
 */

import { ulid } from "ulid"

/**
 * 示例 Tasker 适配器
 * 
 * 这个示例展示了一个基本的 Tasker 实现，包括：
 * - 消息发送和接收
 * - 事件处理
 * - 错误处理
 * - 连接管理
 */
Bot.tasker.push(
  new (class ExampleTasker {
    id = "EXAMPLE"
    name = "ExampleTasker"
    path = this.name
    echo = new Map()
    timeout = 60000

    /**
     * 生成日志消息（隐藏敏感信息）
     * @param {*} msg - 要处理的消息
     * @returns {string} 处理后的日志消息
     */
    makeLog(msg) {
      return Bot.String(msg).replace(/base64:\/\/.*?(,|]|")/g, "base64://...$1")
    }

    /**
     * 发送 API 请求（示例）
     * 实际使用时需要根据具体的平台 API 实现
     * 
     * @param {Object} data - Bot 数据对象
     * @param {Object} ws - WebSocket 连接（如果使用）
     * @param {string} action - API 动作名称
     * @param {Object} params - API 参数
     * @returns {Promise} API 响应
     */
    sendApi(data, ws, action, params = {}) {
      const echo = ulid()
      const request = { action, params, echo }
      
      // 发送请求（示例：通过 WebSocket）
      if (ws && ws.sendMsg) {
        ws.sendMsg(request)
      }

      // 创建 Promise 用于异步响应
      const cache = Promise.withResolvers()
      this.echo.set(echo, cache)

      // 设置超时
      const timeout = setTimeout(() => {
        cache.reject(Bot.makeError("请求超时", request, { timeout: this.timeout }))
        Bot.makeLog("error", ["请求超时", request], data.self_id)
        if (ws) ws.terminate()
      }, this.timeout)

      // 返回 Promise
      return cache.promise
        .then(response => {
          // 处理响应
          if (response.retcode !== 0 && response.retcode !== 1) {
            throw Bot.makeError(response.msg || response.wording, request, { error: response })
          }
          
          // 返回数据（支持 Proxy 包装）
          return response.data
            ? new Proxy(response, {
                get: (target, prop) => target.data[prop] ?? target[prop],
              })
            : response
        })
        .finally(() => {
          clearTimeout(timeout)
          this.echo.delete(echo)
        })
    }

    /**
     * 转换文件为平台需要的格式
     * 
     * @param {string|Buffer} file - 文件路径或 Buffer
     * @param {Object} opts - 选项
     * @returns {Promise<string>} 转换后的文件格式
     */
    async makeFile(file, opts) {
      file = await Bot.Buffer(file, {
        http: true,
        size: 10485760, // 10MB
        ...opts,
      })
      
      // 如果是 Buffer，转换为 base64
      if (Buffer.isBuffer(file)) {
        return `base64://${file.toString("base64")}`
      }
      
      return file
    }

    /**
     * 处理消息格式，转换为平台需要的格式
     * 
     * @param {string|Array|Object} msg - 消息内容
     * @returns {Promise<Array>} 处理后的消息数组
     */
    async makeMsg(msg) {
      if (!Array.isArray(msg)) msg = [msg]
      const msgs = []
      const forward = []

      for (let i of msg) {
        // 处理字符串消息
        if (typeof i !== "object") {
          i = { type: "text", data: { text: i } }
        } 
        // 处理对象消息（缺少 data 字段）
        else if (!i.data) {
          i = { type: i.type, data: { ...i, type: undefined } }
        }

        // 根据消息类型处理
        switch (i.type) {
          case "at":
            // @ 消息
            i.data.qq = String(i.data.qq)
            break
          case "reply":
            // 回复消息
            i.data.id = String(i.data.id)
            break
          case "button":
            // 按钮消息（某些平台不支持，跳过）
            continue
          case "node":
            // 转发消息节点
            forward.push(...i.data)
            continue
          case "raw":
            // 原始消息格式
            i = i.data
            break
        }

        // 处理文件
        if (i.data.file) {
          i.data.file = await this.makeFile(i.data.file)
        }
        
        msgs.push(i)
      }
      
      return [msgs, forward]
    }

    /**
     * 发送消息（统一入口）
     * 
     * @param {*} msg - 消息内容
     * @param {Function} send - 发送普通消息的函数
     * @param {Function} sendForwardMsg - 发送转发消息的函数
     * @returns {Promise} 发送结果
     */
    async sendMsg(msg, send, sendForwardMsg) {
      const [message, forward] = await this.makeMsg(msg)
      const ret = []

      // 处理转发消息
      if (forward.length) {
        const data = await sendForwardMsg(forward)
        if (Array.isArray(data)) ret.push(...data)
        else ret.push(data)
      }

      // 处理普通消息
      if (message.length) {
        ret.push(await send(message))
      }

      // 返回结果
      if (ret.length === 1) return ret[0]

      // 提取消息 ID
      const message_id = []
      for (const i of ret) {
        if (i?.message_id) message_id.push(i.message_id)
      }
      
      return { data: ret, message_id }
    }

    /**
     * 发送好友消息
     * 
     * @param {Object} data - Bot 数据对象
     * @param {*} msg - 消息内容
     * @returns {Promise} 发送结果
     */
    sendFriendMsg(data, msg) {
      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog(
            "info",
            `发送好友消息：${this.makeLog(message)}`,
            `${data.self_id} => ${data.user_id}`,
            true,
          )
          
          // 实际使用时，这里应该调用平台的 API
          // 示例：return data.bot.sendApi("send_msg", { user_id: data.user_id, message })
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 })
        },
        msg => this.sendFriendForwardMsg(data, msg),
      )
    }

    /**
     * 发送群消息
     * 
     * @param {Object} data - Bot 数据对象
     * @param {*} msg - 消息内容
     * @returns {Promise} 发送结果
     */
    sendGroupMsg(data, msg) {
      // 处理戳一戳
      if (msg && typeof msg === 'object' && msg.type === "poke" && msg.qq) {
        return this.sendPoke(data, msg.qq)
      }

      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog(
            "info",
            `发送群消息：${this.makeLog(message)}`,
            `${data.self_id} => ${data.group_id}`,
            true,
          )
          
          // 实际使用时，这里应该调用平台的 API
          // 示例：return data.bot.sendApi("send_msg", { group_id: data.group_id, message })
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 })
        },
        msg => this.sendGroupForwardMsg(data, msg),
      )
    }

    /**
     * 发送戳一戳
     * 
     * @param {Object} data - Bot 数据对象
     * @param {string|number} user_id - 用户 ID
     * @returns {Promise} 发送结果
     */
    sendPoke(data, user_id) {
      Bot.makeLog("info", `发送戳一戳：${user_id}`, `${data.self_id} => ${data.group_id}`, true)
      
      // 实际使用时，这里应该调用平台的 API
      // 示例：return data.bot.sendApi("send_poke", { group_id: data.group_id, user_id: Number(user_id) })
      return Promise.resolve({ success: true })
    }

    /**
     * 发送好友转发消息
     * 
     * @param {Object} data - Bot 数据对象
     * @param {Array} msg - 转发消息数组
     * @returns {Promise} 发送结果
     */
    async sendFriendForwardMsg(data, msg) {
      // 实际使用时需要实现转发消息逻辑
      Bot.makeLog("info", `发送好友转发消息`, data.self_id)
      return Promise.resolve({ message_id: ulid() })
    }

    /**
     * 发送群转发消息
     * 
     * @param {Object} data - Bot 数据对象
     * @param {Array} msg - 转发消息数组
     * @returns {Promise} 发送结果
     */
    async sendGroupForwardMsg(data, msg) {
      // 实际使用时需要实现转发消息逻辑
      Bot.makeLog("info", `发送群转发消息`, data.self_id)
      return Promise.resolve({ message_id: ulid() })
    }

    /**
     * 撤回消息
     * 
     * @param {Object} data - Bot 数据对象
     * @param {string|Array} message_id - 消息 ID
     * @returns {Promise} 撤回结果
     */
    async recallMsg(data, message_id) {
      Bot.makeLog("info", `撤回消息：${message_id}`, data.self_id)
      
      if (!Array.isArray(message_id)) message_id = [message_id]
      
      const msgs = []
      for (const i of message_id) {
        try {
          // 实际使用时，这里应该调用平台的 API
          // 示例：await data.bot.sendApi("delete_msg", { message_id: i })
          msgs.push({ success: true, message_id: i })
        } catch (error) {
          msgs.push({ success: false, message_id: i, error: error.message })
        }
      }
      
      return msgs
    }

    /**
     * 解析消息内容（从平台格式转换为框架格式）
     * 
     * @param {*} message - 平台原始消息
     * @returns {Array} 解析后的消息数组
     */
    parseMsg(message) {
      // 实际使用时需要根据平台的消息格式进行解析
      // 这里只是示例结构
      if (typeof message === 'string') {
        return [{ type: 'text', data: { text: message } }]
      }
      
      if (Array.isArray(message)) {
        return message.map(msg => {
          if (typeof msg === 'string') {
            return { type: 'text', data: { text: msg } }
          }
          return msg
        })
      }
      
      return [message]
    }

    /**
     * 初始化 Tasker（可选）
     * 在 Tasker 加载时调用
     */
    async init() {
      Bot.makeLog("info", `Tasker "${this.name}" 已初始化`, this.id)
    }

    /**
     * 清理资源（可选）
     * 在 Tasker 卸载时调用
     */
    async destroy() {
      this.echo.clear()
      Bot.makeLog("info", `Tasker "${this.name}" 已卸载`, this.id)
    }
  })()
)
