import EventListenerBase from '../../../src/infrastructure/listener/base.js'
import { EventNormalizer } from '../../../src/utils/event-normalizer.js'
import BotUtil from '../../../src/utils/botutil.js'

/**
 * 自定义事件监听器示例
 * 
 * 这个示例展示了如何创建一个自定义的事件监听器。
 * 事件监听器用于接收和处理来自不同平台的事件。
 */

export default class ExampleCustomEvent extends EventListenerBase {
  constructor() {
    super('example-custom')  // 监听器名称
  }

  /**
   * 初始化监听器
   */
  async init() {
    const bot = this.bot || Bot;
    this._boundHandler = (e) => this.handleEvent(e);
    bot.on('custom.message', this._boundHandler);
    bot.on('custom.notice', this._boundHandler);
    bot.on('custom.request', this._boundHandler);

    BotUtil.makeLog('info', '自定义事件监听器已初始化', 'ExampleCustomEvent');
  }

  /**
   * 处理接收到的事件
   * @param {Object} e - 事件对象
   */
  async handleEvent(e) {
    if (!e) return

    // 确保事件有 ID
    this.ensureEventId(e)

    // 标记事件已处理（避免重复处理）
    if (!this.markProcessed(e)) return

    // 标记适配器信息
    this.markAdapter(e, { 
      isCustom: true,
      adapter: 'example-custom'
    })

    // 标准化事件格式
    this.normalizeEvent(e)

    // 交给插件系统处理
    await this.plugins.deal(e)
  }

  /**
   * 标准化事件格式
   * @param {Object} e - 事件对象
   */
  normalizeEvent(e) {
    // 使用统一的事件标准化器
    EventNormalizer.normalize(e, {
      defaultPostType: 'message',
      defaultMessageType: e.group_id ? 'group' : 'private',
      defaultUserId: e.user_id || 'custom-user'
    })

    // 自定义事件的特殊标准化逻辑
    // 确保必要字段存在
    if (!e.sender) {
      e.sender = {}
    }
    if (!e.sender.nickname) {
      e.sender.nickname = e.sender.user_id || 'Custom User'
    }

    // 添加自定义字段（示例）
    if (!e.custom_data) {
      e.custom_data = {
        source: 'custom-adapter',
        timestamp: Date.now()
      }
    }

    // 处理消息内容（如果有）
    if (e.message && typeof e.message === 'string') {
      e.msg = e.message
    } else if (e.content) {
      e.msg = typeof e.content === 'string' ? e.content : JSON.stringify(e.content)
    }

    // 确保消息类型字段存在
    if (!e.message_type) {
      e.message_type = e.group_id ? 'group' : 'private'
    }
  }

  /**
   * 清理资源（监听器卸载时调用）
   */
  async destroy() {
    const bot = this.bot || Bot;
    if (this._boundHandler) {
      bot.off('custom.message', this._boundHandler);
      bot.off('custom.notice', this._boundHandler);
      bot.off('custom.request', this._boundHandler);
      this._boundHandler = null;
    }
    BotUtil.makeLog('info', '自定义事件监听器已卸载', 'ExampleCustomEvent');
  }
}