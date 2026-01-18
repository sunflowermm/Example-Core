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

Bot.tasker.push(
  new (class ExampleTasker {
    id = "EXAMPLE"
    name = "ExampleTasker"
    path = this.name
    echo = new Map()
    timeout = 60000

    makeLog(msg) {
      return Bot.String(msg).replace(/base64:\/\/.*?(,|]|")/g, "base64://...$1")
    }

    sendApi(data, ws, action, params = {}) {
      const echo = ulid()
      const request = { action, params, echo }
      
      if (ws?.sendMsg) {
        ws.sendMsg(request)
      }

      const cache = Promise.withResolvers()
      this.echo.set(echo, cache)

      const timeout = setTimeout(() => {
        cache.reject(Bot.makeError("请求超时", request, { timeout: this.timeout }))
        Bot.makeLog("error", ["请求超时", request], data.self_id)
        ws?.terminate()
      }, this.timeout)

      return cache.promise
        .then(response => {
          if (response.retcode !== 0 && response.retcode !== 1) {
            throw Bot.makeError(response.msg || response.wording, request, { error: response })
          }
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

    async makeFile(file, opts) {
      file = await Bot.Buffer(file, {
        http: true,
        size: 10485760,
        ...opts,
      })
      return Buffer.isBuffer(file) ? `base64://${file.toString("base64")}` : file
    }

    async makeMsg(msg) {
      if (!Array.isArray(msg)) msg = [msg]
      const msgs = []
      const forward = []

      for (let i of msg) {
        if (typeof i !== "object") {
          i = { type: "text", data: { text: i } }
        } else if (!i.data) {
          i = { type: i.type, data: { ...i, type: undefined } }
        }

        switch (i.type) {
          case "at":
            i.data.qq = String(i.data.qq)
            break
          case "reply":
            i.data.id = String(i.data.id)
            break
          case "button":
            continue
          case "node":
            forward.push(...i.data)
            continue
          case "raw":
            i = i.data
            break
        }

        if (i.data?.file) {
          i.data.file = await this.makeFile(i.data.file)
        }
        msgs.push(i)
      }
      
      return [msgs, forward]
    }

    async sendMsg(msg, send, sendForwardMsg) {
      const [message, forward] = await this.makeMsg(msg)
      const ret = []

      if (forward.length) {
        const data = await sendForwardMsg(forward)
        ret.push(...(Array.isArray(data) ? data : [data]))
      }

      if (message.length) {
        ret.push(await send(message))
      }

      if (ret.length === 1) return ret[0]

      const message_id = ret.filter(i => i?.message_id).map(i => i.message_id)
      return { data: ret, message_id }
    }

    sendFriendMsg(data, msg) {
      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog("info", `发送好友消息：${this.makeLog(message)}`, `${data.self_id} => ${data.user_id}`, true)
          // 实际使用时调用平台 API: return data.bot.sendApi("send_msg", { user_id: data.user_id, message })
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 })
        },
        msg => this.sendFriendForwardMsg(data, msg),
      )
    }

    sendGroupMsg(data, msg) {
      if (msg?.type === "poke" && msg.qq) {
        return this.sendPoke(data, msg.qq)
      }

      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog("info", `发送群消息：${this.makeLog(message)}`, `${data.self_id} => ${data.group_id}`, true)
          // 实际使用时调用平台 API: return data.bot.sendApi("send_msg", { group_id: data.group_id, message })
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 })
        },
        msg => this.sendGroupForwardMsg(data, msg),
      )
    }

    sendPoke(data, user_id) {
      Bot.makeLog("info", `发送戳一戳：${user_id}`, `${data.self_id} => ${data.group_id}`, true)
      // 实际使用时调用平台 API: return data.bot.sendApi("send_poke", { group_id: data.group_id, user_id: Number(user_id) })
      return Promise.resolve({ success: true })
    }

    async sendFriendForwardMsg(data, msg) {
      Bot.makeLog("info", `发送好友转发消息`, data.self_id)
      return Promise.resolve({ message_id: ulid() })
    }

    async sendGroupForwardMsg(data, msg) {
      Bot.makeLog("info", `发送群转发消息`, data.self_id)
      return Promise.resolve({ message_id: ulid() })
    }

    async recallMsg(data, message_id) {
      Bot.makeLog("info", `撤回消息：${message_id}`, data.self_id)
      const ids = Array.isArray(message_id) ? message_id : [message_id]
      return ids.map(i => {
        try {
          // 实际使用时调用平台 API: await data.bot.sendApi("delete_msg", { message_id: i })
          return { success: true, message_id: i }
        } catch (error) {
          return { success: false, message_id: i, error: error.message }
        }
      })
    }

    parseMsg(message) {
      if (typeof message === 'string') {
        return [{ type: 'text', data: { text: message } }]
      }
      if (Array.isArray(message)) {
        return message.map(msg => typeof msg === 'string' ? { type: 'text', data: { text: msg } } : msg)
      }
      return [message]
    }

    load() {
      // 注册 WebSocket 消息处理器（示例）
      // 实际使用时需要根据平台协议实现
      if (!Array.isArray(Bot.wsf[this.path])) {
        Bot.wsf[this.path] = []
      }
      Bot.wsf[this.path].push((ws, ...args) => {
        ws.on("message", data => {
          // 处理接收到的消息
          // 实际使用时需要解析平台消息格式并触发 Bot 事件
          Bot.makeLog("debug", `收到消息：${this.makeLog(data)}`, this.id)
        })
      })
    }

    async destroy() {
      this.echo.clear()
      Bot.makeLog("info", `Tasker "${this.name}" 已卸载`, this.id)
    }
  })()
)
