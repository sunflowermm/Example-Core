import AIStream from '../../../src/infrastructure/aistream/aistream.js';
import BotUtil from '../../../src/utils/botutil.js';

/**
 * AI 工作流示例
 * 
 * 这个示例展示了如何创建一个 AI 工作流。
 * AI 工作流用于处理复杂的 AI 对话和任务。
 * 
 * 工作流继承自 AIStream 类，提供 AI 对话、函数调用、Embedding 等功能。
 */

export default class ExampleStream extends AIStream {
  constructor() {
    super({
      name: 'example-stream',  // 工作流名称
      description: '示例 AI 工作流',
      version: '1.0.0',
      author: 'XRK',
      priority: 100,
      config: {
        enabled: true,
        temperature: 0.8,
        maxTokens: 6000,
        topP: 0.9,
        presencePenalty: 0.6,
        frequencyPenalty: 0.6
      },
      embedding: {
        enabled: true  // 启用 Embedding 功能
      }
    });
  }

  /**
   * 初始化工作流
   * 在工作流加载时调用，只执行一次
   */
  async init() {
    await super.init();  // 调用父类初始化方法
    
    // 在这里可以注册自定义函数、加载资源等
    // 例如：this.registerAllFunctions();
    
    BotUtil.makeLog('info', `工作流 "${this.name}" 已初始化`, 'ExampleStream');
    return true;
  }

  /**
   * 构建系统提示词
   * 可以覆盖此方法来自定义系统提示词
   * 
   * @param {Object} context - 上下文信息
   * @returns {Promise<string>}
   */
  async buildSystemPrompt(context) {
    // 返回系统提示词
    return '你是一个友好的助手，用于演示工作流功能。';
  }

  /**
   * 处理用户输入
   * 这个方法会被插件或其他地方调用
   * 
   * @param {Object} e - 事件对象
   * @param {string} input - 用户输入（可以是字符串或对象）
   * @param {Object} options - 选项配置
   * @param {boolean} options.enableTodo - 是否启用待办事项
   * @param {boolean} options.enableMemory - 是否启用记忆功能
   * @param {boolean} options.enableDatabase - 是否启用数据库查询
   */
  async process(e, input, options = {}) {
    // 设置默认选项
    const opts = {
      enableTodo: false,
      enableMemory: false,
      enableDatabase: false,
      ...options
    };

    // 处理输入（可能是字符串或对象）
    const question = typeof input === 'string' ? input : input.text || input.message || '';
    
    if (!question.trim()) {
      BotUtil.makeLog('warn', '工作流收到空输入', 'ExampleStream');
      return null;
    }

    try {
      // 构建聊天上下文
      const messages = await this.buildChatContext(e, {
        text: question,
        ...(typeof input === 'object' ? input : {})
      });

      // 调用 AI（这里会调用实际的 LLM API）
      // 如果需要流式输出，可以使用 callAIStream
      const response = await this.callAI(messages, this.config, {
        enableFunctionCalling: true,
        context: { e, question }
      });

      // 注意：工作流通常只负责生成响应，不负责发送消息
      // 消息发送应该由调用者（如插件）来处理
      return response;
    } catch (error) {
      BotUtil.makeLog('error', `工作流处理失败: ${error.message}`, 'ExampleStream');
      throw error;
    }
  }

  /**
   * 注册自定义函数（示例）
   * 可以在这里注册自定义的 Function Calling 函数
   */
  registerAllFunctions() {
    // 示例：注册一个获取当前时间的函数
    this.registerFunction({
      name: 'get_current_time',
      description: '获取当前时间',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: '时间格式：iso（ISO格式）、locale（本地格式）、timestamp（时间戳）',
            enum: ['iso', 'locale', 'timestamp']
          }
        }
      },
      handler: async (params) => {
        const { format = 'locale' } = params;
        const now = new Date();
        
        switch (format) {
          case 'iso':
            return now.toISOString();
          case 'timestamp':
            return now.getTime().toString();
          case 'locale':
          default:
            return now.toLocaleString('zh-CN');
        }
      }
    });

    // 示例：注册一个计算函数
    this.registerFunction({
      name: 'calculate',
      description: '执行简单的数学计算',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: '数学表达式，例如：2+2, 10*5, 100/4'
          }
        },
        required: ['expression']
      },
      handler: async (params) => {
        const { expression } = params;
        try {
          // 注意：实际使用时应该使用更安全的表达式解析器
          // 这里只是示例
          if (!/^[\d+\-*/().\s]+$/.test(expression)) {
            return { error: '表达式包含非法字符' };
          }
          const result = Function(`"use strict"; return (${expression})`)();
          return { result, expression };
        } catch (error) {
          return { error: error.message };
        }
      }
    });

    // 示例：注册一个文本处理函数
    this.registerFunction({
      name: 'text_process',
      description: '处理文本，支持反转、大写、小写等操作',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '要处理的文本'
          },
          operation: {
            type: 'string',
            description: '操作类型',
            enum: ['reverse', 'uppercase', 'lowercase', 'length', 'words']
          }
        },
        required: ['text', 'operation']
      },
      handler: async (params) => {
        const { text, operation } = params;
        
        switch (operation) {
          case 'reverse':
            return { result: text.split('').reverse().join('') };
          case 'uppercase':
            return { result: text.toUpperCase() };
          case 'lowercase':
            return { result: text.toLowerCase() };
          case 'length':
            return { result: text.length };
          case 'words':
            return { result: text.split(/\s+/).filter(w => w).length };
          default:
            return { error: '不支持的操作类型' };
        }
      }
    });
  }

  /**
   * 处理函数调用结果（可选）
   * 可以覆盖此方法来自定义函数调用的处理逻辑
   * 
   * @param {Object} functionCall - 函数调用信息
   * @param {Object} result - 函数执行结果
   * @returns {Promise<string>}
   */
  async handleFunctionResult(functionCall, result) {
    // 默认处理：将结果转换为字符串
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  }

  /**
   * 错误处理（可选）
   * 可以覆盖此方法来自定义错误处理逻辑
   * 
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  async handleError(error, context) {
    BotUtil.makeLog('error', `工作流错误: ${error.message}`, 'ExampleStream', {
      stack: error.stack,
      context
    });
    
    // 可以在这里实现错误恢复逻辑
    // 例如：重试、降级处理等
  }
}