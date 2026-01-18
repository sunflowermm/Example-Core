import BotUtil from '#utils/botutil.js'

/**
 * 定时任务插件示例
 * 
 * 这个示例展示了如何创建定时任务插件。
 * 使用 cron 表达式来定义执行时间。
 */

export default class ExampleTimer extends plugin {
  constructor() {
    super({
      name: '定时任务示例插件',
      dsc: '定时任务插件示例',
      event: 'message',
      priority: 5000,
      // 定义定时任务
      task: [
        {
          name: '每小时问候',
          cron: '0 * * * *',  // 每小时的第 0 分钟执行
          fnc: 'hourlyGreeting',
          log: true  // 是否记录日志
        },
        {
          name: '每天定时任务',
          cron: '0 9 * * *',  // 每天 9:00 执行
          fnc: 'dailyTask',
          log: true
        },
        {
          name: '每周任务',
          cron: '0 10 * * 1',  // 每周一 10:00 执行
          fnc: 'weeklyTask',
          log: true
        },
        {
          name: '每分钟检查',
          cron: '* * * * *',  // 每分钟执行（示例，实际使用时谨慎使用）
          fnc: 'minuteCheck',
          log: false  // 频繁任务可以不记录日志
        }
      ],
      rule: [
        {
          reg: '^#定时测试$',
          fnc: 'testTimer',
          permission: 'master'  // 仅主人可用
        }
      ]
    })
  }

  /**
   * 每小时执行的任务
   */
  async hourlyGreeting() {
    BotUtil.makeLog('info', '定时任务执行：每小时问候', 'ExampleTimer')
    
    // 示例：获取当前时间
    const now = new Date()
    const hour = now.getHours()
    
    // 根据时间段发送不同的问候
    let greeting = ''
    if (hour >= 6 && hour < 12) {
      greeting = '早上好！新的一天开始了。'
    } else if (hour >= 12 && hour < 18) {
      greeting = '下午好！工作辛苦了。'
    } else if (hour >= 18 && hour < 22) {
      greeting = '晚上好！'
    } else {
      greeting = '夜深了，注意休息。'
    }

    BotUtil.makeLog('info', `定时问候：${greeting}`, 'ExampleTimer')
    
    // 实际使用时，可以获取所有群组或用户，发送消息
    // const bot = Bot[this.e?.self_id] || Bot
    // if (bot && bot.getGroupList) {
    //   const groups = await bot.getGroupList()
    //   for (const group of groups) {
    //     await bot.sendGroupMsg(group.group_id, greeting)
    //   }
    // }
  }

  /**
   * 每天执行的任务
   */
  async dailyTask() {
    BotUtil.makeLog('info', '定时任务执行：每天定时任务', 'ExampleTimer')
    
    const now = new Date()
    const dateStr = now.toLocaleDateString('zh-CN')
    
    // 示例任务：每日统计、数据清理等
    BotUtil.makeLog('info', `执行每日任务 - ${dateStr}`, 'ExampleTimer')
    
    // 示例：数据备份（伪代码）
    // await backupData()
    
    // 示例：清理临时文件（伪代码）
    // await cleanTempFiles()
    
    // 示例：生成每日报告（伪代码）
    // await generateDailyReport()
    
    BotUtil.makeLog('info', '每日任务执行完成', 'ExampleTimer')
  }

  /**
   * 每周执行的任务（示例）
   * 注意：需要在 task 配置中添加对应的 cron 表达式
   */
  async weeklyTask() {
    BotUtil.makeLog('info', '定时任务执行：每周任务', 'ExampleTimer')
    
    // 示例：每周数据统计、周报生成等
    const week = Math.ceil(new Date().getDate() / 7)
    BotUtil.makeLog('info', `执行第 ${week} 周任务`, 'ExampleTimer')
  }

  /**
   * 每分钟检查（示例）
   * 注意：频繁任务应该轻量级，避免影响性能
   */
  async minuteCheck() {
    // 示例：检查系统状态、监控等
    // 这里只是示例，实际使用时应该做轻量级检查
    // BotUtil.makeLog('debug', '每分钟检查执行', 'ExampleTimer')
  }

  /**
   * 测试定时任务（手动触发）
   */
  async testTimer() {
    const now = new Date()
    const timeStr = now.toLocaleString('zh-CN')
    
    await this.reply(`定时任务插件运行正常！\n当前时间：${timeStr}\n已配置的任务：\n- 每小时问候\n- 每天定时任务\n- 每周任务`)
    return true
  }
}