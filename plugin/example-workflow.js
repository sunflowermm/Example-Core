import StreamLoader from '#infrastructure/aistream/loader.js'
import BotUtil from '#utils/botutil.js'

/**
 * 工作流插件示例
 * 
 * 这个示例展示了如何在工作流中使用 AI 来处理用户请求。
 * 包含了多种工作流使用场景和配置选项。
 */

export default class ExampleWorkflow extends plugin {
  constructor() {
    super({
      name: '工作流示例插件',
      dsc: 'AI 工作流插件示例，包含多种使用场景',
      event: 'message',
      priority: 1000,
      rule: [
        {
          reg: '^ai:',
          fnc: 'triggerWorkflow'
        },
        {
          reg: '^#ai\\s+(.+)$',
          fnc: 'triggerWorkflowWithOptions'
        },
        {
          reg: '^#ai-help$',
          fnc: 'showWorkflowHelp'
        }
      ]
    })
  }

  /**
   * 触发 AI 工作流（基础版本）
   * @returns {Promise<boolean>}
   */
  async triggerWorkflow() {
    if (!this.e.msg?.trim().startsWith('ai:')) {
      return false
    }

    // 提取问题（去掉 "ai:" 前缀）
    const question = this.e.msg.trim().substring(3).trim()
    
    if (!question) {
      await this.reply('请提供要询问的问题，例如：ai:今天天气怎么样？')
      return true
    }

    // 获取工作流实例（这里使用 'chat' 工作流作为示例）
    const stream = StreamLoader.getStream('chat')
    if (!stream) {
      await this.reply('工作流未加载，请检查配置')
      return true
    }

    try {
      // 调用工作流处理问题
      // process 方法会自动处理 AI 对话
      await stream.process(this.e, question, {
        enableTodo: false,      // 是否启用待办事项
        enableMemory: true,      // 是否启用记忆功能
        enableDatabase: false   // 是否启用数据库查询
      })
    } catch (error) {
      BotUtil.makeLog('error', `工作流处理失败: ${error.message}`, 'ExampleWorkflow')
      await this.reply(`处理失败：${error.message}`)
    }

    return true
  }

  /**
   * 触发 AI 工作流（带选项版本）
   * @returns {Promise<boolean>}
   */
  async triggerWorkflowWithOptions() {
    const match = this.e.msg?.match(/^#ai\s+(.+)$/)
    if (!match) {
      return false
    }

    const input = match[1].trim()
    if (!input) {
      await this.reply('请提供要询问的问题，例如：#ai 今天天气怎么样？')
      return true
    }

    // 解析选项（示例：支持 --memory, --todo, --db 等选项）
    const options = {
      enableTodo: input.includes('--todo'),
      enableMemory: input.includes('--memory') || !input.includes('--no-memory'),
      enableDatabase: input.includes('--db')
    }

    // 移除选项标记，获取纯问题
    const question = input
      .replace(/--todo/g, '')
      .replace(/--memory/g, '')
      .replace(/--no-memory/g, '')
      .replace(/--db/g, '')
      .trim()

    if (!question) {
      await this.reply('请提供要询问的问题')
      return true
    }

    const stream = StreamLoader.getStream('chat')
    if (!stream) {
      await this.reply('工作流未加载，请检查配置')
      return true
    }

    try {
      await stream.process(this.e, question, options)
    } catch (error) {
      BotUtil.makeLog('error', `工作流处理失败: ${error.message}`, 'ExampleWorkflow')
      await this.reply(`处理失败：${error.message}`)
    }

    return true
  }

  /**
   * 显示工作流帮助信息
   * @returns {Promise<boolean>}
   */
  async showWorkflowHelp() {
    if (this.e.msg?.trim() !== '#ai-help') {
      return false
    }

    const helpText = `
【AI 工作流插件 - 帮助】

基础用法：
• ai:<问题> - 使用 AI 工作流回答问题
  示例：ai:今天天气怎么样？

高级用法：
• #ai <问题> [选项] - 带选项的工作流调用
  选项：
  --memory    启用记忆功能（默认启用）
  --no-memory 禁用记忆功能
  --todo      启用待办事项功能
  --db        启用数据库查询功能
  
  示例：
  #ai 帮我制定学习计划 --todo
  #ai 查询用户信息 --db
  #ai 简单问题 --no-memory

提示：
• 工作流会自动处理 AI 对话和响应
• 根据需求选择合适的选项可以优化性能
• 记忆功能会保存对话历史，适合连续对话
    `.trim()

    await this.reply(helpText)
    return true
  }
}