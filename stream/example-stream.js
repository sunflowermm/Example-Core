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
   */
  async init() {
    await super.init();
    this.registerAllFunctions();
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

      // 调用 AI（callAI 签名为 messages, apiConfig）
      const response = await this.callAI(messages, this.config);
      return response;
    } catch (error) {
      BotUtil.makeLog('error', `工作流处理失败: ${error.message}`, 'ExampleStream');
      throw error;
    }
  }

  /**
   * 注册 MCP 工具（与 Function Calling 对应，供 LLM 调用）
   */
  registerAllFunctions() {
    this.registerMCPTool('get_current_time', {
      description: '获取当前时间',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: '时间格式：iso（ISO格式）、locale（本地格式）、timestamp（时间戳）',
            enum: ['iso', 'locale', 'timestamp']
          }
        }
      },
      handler: async (params = {}) => {
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

    this.registerMCPTool('calculate', {
      description: '执行简单的数学计算',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: '数学表达式，例如：2+2, 10*5'
          }
        },
        required: ['expression']
      },
      handler: async (params = {}) => {
        const { expression } = params;
        try {
          if (!/^[\d+\-*/().\s]+$/.test(expression)) {
            return this.errorResponse('INVALID_PARAM', '表达式包含非法字符');
          }
          const result = Function(`"use strict"; return (${expression})`)();
          return this.successResponse({ result, expression });
        } catch (error) {
          return this.errorResponse('CALC_ERROR', error.message);
        }
      }
    });

    this.registerMCPTool('text_process', {
      description: '处理文本：反转、大写、小写、长度、词数',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要处理的文本' },
          operation: {
            type: 'string',
            description: '操作类型',
            enum: ['reverse', 'uppercase', 'lowercase', 'length', 'words']
          }
        },
        required: ['text', 'operation']
      },
      handler: async (params = {}) => {
        const { text, operation } = params;
        switch (operation) {
          case 'reverse':
            return this.successResponse({ result: text.split('').reverse().join('') });
          case 'uppercase':
            return this.successResponse({ result: text.toUpperCase() });
          case 'lowercase':
            return this.successResponse({ result: text.toLowerCase() });
          case 'length':
            return this.successResponse({ result: text.length });
          case 'words':
            return this.successResponse({ result: text.split(/\s+/).filter(w => w).length });
          default:
            return this.errorResponse('INVALID_PARAM', '不支持的操作');
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
  }
}