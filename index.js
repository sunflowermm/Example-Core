/**
 * XRK-Core 示例集合入口文件
 * 
 * 这个文件展示了如何组织和导出示例模块。
 * 注意：在实际使用中，框架会自动加载这些文件，无需手动导入。
 * 
 * 本目录包含以下示例：
 * - plugin/     - 插件示例
 * - events/     - 事件监听器示例
 * - http/       - HTTP API 示例
 * - stream/     - AI 工作流示例
 * - tasker/     - Tasker 适配器示例
 * - www/        - Web 界面示例
 */

export default {
  name: 'xrk-core-examples',
  version: '1.0.0',
  description: 'XRK-AGT Core 开发示例集合',
  modules: {
    plugins: [
      'plugin/example-basic.js',
      'plugin/example-workflow.js',
      'plugin/example-timer.js'
    ],
    events: [
      'events/example-custom.js'
    ],
    http: [
      'http/example-api.js'
    ],
    streams: [
      'stream/example-stream.js'
    ],
    taskers: [
      'tasker/example-tasker.js'
    ],
    www: [
      'www/example.html'
    ]
  }
}