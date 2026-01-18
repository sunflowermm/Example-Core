/**
 * 基础插件示例
 * 
 * 这是一个最基础的插件示例，展示了如何创建一个简单的消息响应插件。
 * 包含了多种常见的插件开发模式和功能。
 */

export default class ExampleBasic extends plugin {
  constructor() {
    super({
      name: '基础示例插件',
      dsc: '这是一个基础插件示例，包含多种常见功能',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^你好$',
          fnc: 'sayHello'
        },
        {
          reg: '^#帮助$',
          fnc: 'showHelp',
          permission: 'all'  // 所有人可用
        },
        {
          reg: '^#信息$',
          fnc: 'showInfo'
        },
        {
          reg: '^#计算\\s+(.+)$',
          fnc: 'calculate'
        },
        {
          reg: '^#随机数\\s+(\\d+)\\s+(\\d+)$',
          fnc: 'randomNumber'
        },
        {
          reg: '^#复读$',
          fnc: 'repeatMessage'
        }
      ]
    })
  }

  /**
   * 处理 "你好" 消息
   * @returns {Promise<boolean>}
   */
  async sayHello() {
    if (this.e.msg?.trim() !== '你好') {
      return false
    }

    const greetings = [
      '你好！这是一个基础插件示例。',
      'Hello! 欢迎使用 XRK-AGT 框架。',
      '你好呀！有什么可以帮你的吗？'
    ]
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    await this.reply(randomGreeting)

    return true
  }

  /**
   * 显示帮助信息
   * @returns {Promise<boolean>}
   */
  async showHelp() {
    if (this.e.msg?.trim() !== '#帮助') {
      return false
    }

    const helpText = `
【基础插件示例 - 帮助】

可用命令：
• #帮助 - 显示此帮助信息
• #信息 - 显示事件信息
• #计算 <表达式> - 计算数学表达式（示例）
• #随机数 <最小值> <最大值> - 生成随机数
• #复读 - 复读上一条消息

提示：这是示例插件，实际使用时请根据需求修改。
    `.trim()

    await this.reply(helpText)
    return true
  }

  /**
   * 显示事件信息（用于调试）
   * @returns {Promise<boolean>}
   */
  async showInfo() {
    if (this.e.msg?.trim() !== '#信息') {
      return false
    }

    const info = {
      消息类型: this.e.post_type || 'unknown',
      消息内容: this.e.msg || '',
      用户ID: this.e.user_id || 'unknown',
      群组ID: this.e.group_id || 'private',
      发送者: this.e.sender?.nickname || 'unknown',
      时间戳: new Date().toLocaleString('zh-CN')
    }

    const infoText = Object.entries(info)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    await this.reply(`【事件信息】\n${infoText}`)
    return true
  }

  /**
   * 计算数学表达式（示例，实际使用时需要更安全的实现）
   * @returns {Promise<boolean>}
   */
  async calculate() {
    const match = this.e.msg?.match(/^#计算\s+(.+)$/)
    if (!match) {
      return false
    }

    const expression = match[1].trim()
    
    // 注意：实际使用时应该使用更安全的表达式解析器
    // 这里只是示例，直接使用 eval 是不安全的
    try {
      // 简单的安全检查（示例）
      if (!/^[\d+\-*/().\s]+$/.test(expression)) {
        await this.reply('表达式包含非法字符，仅支持数字和基本运算符')
        return true
      }

      const result = Function(`"use strict"; return (${expression})`)()
      await this.reply(`计算结果：${expression} = ${result}`)
    } catch (error) {
      await this.reply(`计算失败：${error.message}`)
    }

    return true
  }

  /**
   * 生成随机数
   * @returns {Promise<boolean>}
   */
  async randomNumber() {
    const match = this.e.msg?.match(/^#随机数\s+(\d+)\s+(\d+)$/)
    if (!match) {
      return false
    }

    const min = parseInt(match[1])
    const max = parseInt(match[2])

    if (min >= max) {
      await this.reply('最小值必须小于最大值')
      return true
    }

    if (max - min > 1000000) {
      await this.reply('范围过大，请限制在 1000000 以内')
      return true
    }

    const random = Math.floor(Math.random() * (max - min + 1)) + min
    await this.reply(`随机数 [${min}-${max}]：${random}`)

    return true
  }

  /**
   * 复读上一条消息（示例）
   * @returns {Promise<boolean>}
   */
  async repeatMessage() {
    if (this.e.msg?.trim() !== '#复读') {
      return false
    }

    // 注意：实际获取上一条消息需要根据具体的 Bot 实现
    // 这里只是示例结构
    await this.reply('复读功能示例：实际使用时需要实现消息历史记录功能')

    return true
  }
}