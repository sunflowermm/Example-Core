/**
 * Example-Core 入口
 *
 * 框架会按目录自动发现并加载本 Core 下的：
 * - plugin/*.js  插件
 * - events/*.js  事件监听器
 * - http/*.js    HTTP API
 * - stream/*.js  工作流
 * - tasker/*.js  Tasker 适配器
 * - www/**       静态页面
 *
 * 无需在此列出 modules，仅作说明，这个文件可以用来创建配置文件，检查配置文件存在性，直接写逻辑会自动加载
 */
export default {
  name: 'example-core',
  version: '1.0.0',
  description: 'XRK-AGT 示例 Core，供学习与二次开发参考'
};
