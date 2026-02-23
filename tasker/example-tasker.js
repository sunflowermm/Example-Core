/**
 * Tasker 适配器示例
 *
 * Tasker 用于连接不同聊天平台（QQ、微信、Telegram 等），负责收发消息与事件。
 * 框架从 core 下各子目录的 tasker 目录自动加载，需将实例 push 到 Bot.tasker。
 * 写法对齐 system-Core 的 OneBotv11：仅用 Bot，不依赖 #utils。
 */

import { ulid } from 'ulid';

Bot.tasker.push(
  new (class ExampleTasker {
    id = 'EXAMPLE';
    name = 'ExampleTasker';
    path = this.name;
    echo = new Map();
    timeout = 60000;

    /** 生成日志消息（隐藏 base64 内容） */
    makeLog(msg) {
      return Bot.String(msg ?? '').replace(/base64:\/\/[^,"\]]+/g, 'base64://...');
    }

    sendApi(data, ws, action, params = {}) {
      const echo = ulid();
      const request = { action, params, echo };

      if (ws?.sendMsg) ws.sendMsg(request);

      const cache = Promise.withResolvers();
      this.echo.set(echo, cache);

      const timeoutId = setTimeout(() => {
        cache.reject(Bot.makeError('请求超时', 'RequestTimeout', { request, timeout: this.timeout }));
        Bot.makeLog('error', [`请求超时: ${action}`, request], data?.self_id ?? this.id);
        ws?.terminate();
      }, this.timeout);

      return cache.promise
        .then(response => {
          if (response.retcode !== 0 && response.retcode !== 1) {
            throw Bot.makeError(response.msg || response.wording || 'API 错误', 'ApiError', { request, error: response });
          }
          return response.data
            ? new Proxy(response, { get: (target, prop) => target.data[prop] ?? target[prop] })
            : response;
        })
        .finally(() => {
          clearTimeout(timeoutId);
          this.echo.delete(echo);
        });
    }

    async makeFile(file, opts) {
      file = await Bot.Buffer(file, {
        http: true,
        size: 10485760,
        ...opts
      });
      return Buffer.isBuffer(file) ? `base64://${file.toString('base64')}` : file;
    }

    async makeMsg(msg) {
      if (!Array.isArray(msg)) msg = [msg];
      const msgs = [];
      const forward = [];

      for (let i of msg) {
        if (typeof i !== 'object') {
          i = { type: 'text', data: { text: i } };
        } else if (!i.data) {
          i = { type: i.type, data: { ...i, type: undefined } };
        }

        switch (i.type) {
          case 'at':
            i.data.qq = String(i.data.qq);
            break;
          case 'reply':
            i.data.id = String(i.data.id);
            break;
          case 'button':
            continue;
          case 'node':
            forward.push(...i.data);
            continue;
          case 'raw':
            i = i.data;
            break;
        }

        if (i.data?.file) i.data.file = await this.makeFile(i.data.file);
        msgs.push(i);
      }

      return [msgs, forward];
    }

    async sendMsg(msg, send, sendForwardMsg) {
      const [message, forward] = await this.makeMsg(msg);
      const ret = [];

      if (forward.length) {
        const data = await sendForwardMsg(forward);
        ret.push(...(Array.isArray(data) ? data : [data]));
      }

      if (message.length) ret.push(await send(message));

      if (ret.length === 1) return ret[0];

      const message_id = ret.filter(i => i?.message_id).map(i => i.message_id);
      return { data: ret, message_id };
    }

    sendFriendMsg(data, msg) {
      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog('info', `发送好友消息：${this.makeLog(message)}`, `${data.self_id} => ${data.user_id}`);
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 });
        },
        m => this.sendFriendForwardMsg(data, m)
      );
    }

    sendGroupMsg(data, msg) {
      if (msg?.type === 'poke' && msg.qq) return this.sendPoke(data, msg.qq);

      return this.sendMsg(
        msg,
        message => {
          Bot.makeLog('info', `发送群消息：${this.makeLog(message)}`, `${data.self_id} => ${data.group_id}`);
          return Promise.resolve({ message_id: ulid(), time: Date.now() / 1000 });
        },
        m => this.sendGroupForwardMsg(data, m)
      );
    }

    sendPoke(data, user_id) {
      Bot.makeLog('info', `发送戳一戳：${user_id}`, `${data.self_id} => ${data.group_id}`);
      return Promise.resolve({ success: true });
    }

    async sendFriendForwardMsg(data, msg) {
      Bot.makeLog('info', '发送好友转发消息', data.self_id);
      return Promise.resolve({ message_id: ulid() });
    }

    async sendGroupForwardMsg(data, msg) {
      Bot.makeLog('info', '发送群转发消息', data.self_id);
      return Promise.resolve({ message_id: ulid() });
    }

    async recallMsg(data, message_id) {
      Bot.makeLog('info', `撤回消息：${message_id}`, data.self_id);
      const ids = Array.isArray(message_id) ? message_id : [message_id];
      return ids.map(i => {
        try {
          return { success: true, message_id: i };
        } catch (error) {
          return { success: false, message_id: i, error: error.message };
        }
      });
    }

    parseMsg(message) {
      if (typeof message === 'string') return [{ type: 'text', data: { text: message } }];
      if (Array.isArray(message)) {
        return message.map(m => (typeof m === 'string' ? { type: 'text', data: { text: m } } : m));
      }
      return [message];
    }

    load() {
      if (!Array.isArray(Bot.wsf[this.path])) Bot.wsf[this.path] = [];
      Bot.wsf[this.path].push(ws => {
        ws.on('message', data => {
          Bot.makeLog('debug', `收到消息：${this.makeLog(data)}`, this.id);
        });
      });
    }

    async destroy() {
      this.echo.clear();
      Bot.makeLog('info', `Tasker "${this.name}" 已卸载`, this.id);
    }
  })()
);
