import { HttpResponse } from '#utils/http-utils.js';
import { InputValidator } from '#utils/input-validator.js';

/**
 * HTTP API 示例
 * 
 * 这个示例展示了如何创建一个 HTTP API 接口。
 * HTTP API 用于提供 Web 服务，可以被前端或其他服务调用。
 * 
 * HTTP API 使用对象导出的方式，包含 name、dsc、priority 和 routes 字段。
 */

export default {
  name: 'example-api',
  dsc: '示例 API 接口',
  priority: 100,

  routes: [
    // GET 请求示例
    {
      method: 'GET',
      path: '/api/example/hello',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        HttpResponse.success(res, {
          message: 'Hello from XRK-AGT!',
          timestamp: Date.now(),
          version: '1.0.0'
        });
      }, 'example.hello')
    },

    // POST 请求示例
    {
      method: 'POST',
      path: '/api/example/echo',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { message } = req.body;
        
        if (!message) {
          return HttpResponse.validationError(res, '缺少 message 字段');
        }

        HttpResponse.success(res, {
          echo: message,
          timestamp: Date.now()
        });
      }, 'example.echo')
    },

    // 带参数的 GET 请求示例
    {
      method: 'GET',
      path: '/api/example/user/:id',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // 验证用户ID格式
        const userId = InputValidator.validateUserId(id);

        // 这里可以查询用户信息（示例）
        HttpResponse.success(res, {
          userId: userId,
          // 实际使用时，这里应该从数据库或其他地方获取用户信息
          userInfo: {
            id: userId,
            name: '示例用户',
            avatar: null
          }
        });
      }, 'example.user')
    },

    // 带查询参数的 GET 请求示例
    {
      method: 'GET',
      path: '/api/example/search',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { q, page = 1, limit = 10 } = req.query;

        if (!q) {
          return HttpResponse.validationError(res, '缺少查询参数 q');
        }

        // 验证分页参数
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

        // 这里可以执行搜索逻辑（示例）
        HttpResponse.success(res, {
          query: q,
          page: pageNum,
          limit: limitNum,
          total: 0,
          results: []  // 实际使用时，这里应该是搜索结果
        });
      }, 'example.search')
    },

    // PUT 请求示例（更新资源）
    {
      method: 'PUT',
      path: '/api/example/user/:id',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!id) {
          return HttpResponse.validationError(res, '缺少用户ID');
        }

        // 验证输入
        if (name && typeof name !== 'string') {
          return HttpResponse.validationError(res, 'name 必须是字符串');
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return HttpResponse.validationError(res, 'email 格式不正确');
        }

        // 这里可以更新用户信息（示例）
        HttpResponse.success(res, {
          userId: id,
          updated: {
            name: name || undefined,
            email: email || undefined
          },
          message: '用户信息更新成功'
        });
      }, 'example.updateUser')
    },

    // DELETE 请求示例
    {
      method: 'DELETE',
      path: '/api/example/user/:id',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!id) {
          return HttpResponse.validationError(res, '缺少用户ID');
        }

        // 这里可以删除用户（示例）
        HttpResponse.success(res, {
          userId: id,
          message: '用户删除成功'
        });
      }, 'example.deleteUser')
    },

    // 文件上传示例（需要配合 multer 等中间件）
    {
      method: 'POST',
      path: '/api/example/upload',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        // 注意：实际使用时需要配置文件上传中间件
        // 这里只是展示接口结构
        
        if (!req.file && !req.files) {
          return HttpResponse.validationError(res, '请选择要上传的文件');
        }

        const file = req.file || (req.files && req.files[0]);
        
        HttpResponse.success(res, {
          filename: file?.originalname,
          size: file?.size,
          mimetype: file?.mimetype,
          message: '文件上传成功',
          // 实际使用时，这里应该返回文件的访问URL
          url: `/uploads/${file?.filename}`
        });
      }, 'example.upload')
    },

    // 错误处理示例
    {
      method: 'GET',
      path: '/api/example/error-demo',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { type } = req.query;

        switch (type) {
          case 'validation':
            return HttpResponse.validationError(res, '这是一个验证错误示例');
          
          case 'notfound':
            return HttpResponse.notFound(res, '资源未找到');
          
          case 'server':
            // 模拟服务器错误
            throw new Error('这是一个服务器错误示例');
          
          default:
            return HttpResponse.success(res, {
              message: '错误处理示例',
              types: ['validation', 'notfound', 'server'],
              usage: '使用 ?type=validation|notfound|server 来测试不同类型的错误'
            });
        }
      }, 'example.errorDemo')
    },

    // 认证中间件示例（需要配合实际的认证逻辑）
    {
      method: 'GET',
      path: '/api/example/protected',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        // 注意：实际使用时需要添加认证中间件
        // 这里只是展示接口结构
        
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return HttpResponse.unauthorized(res, '需要认证令牌');
        }

        // 这里可以验证token（示例）
        // const user = await verifyToken(token);
        // if (!user) {
        //   return HttpResponse.unauthorized(res, '无效的认证令牌');
        // }

        HttpResponse.success(res, {
          message: '这是受保护的资源',
          user: 'authenticated-user'  // 实际使用时应该返回真实的用户信息
        });
      }, 'example.protected')
    },

    // 分页列表示例
    {
      method: 'GET',
      path: '/api/example/list',
      handler: HttpResponse.asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, sort = 'id', order = 'asc' } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;

        // 这里可以查询数据库（示例）
        // const { data, total } = await queryDatabase({ offset, limit: limitNum, sort, order });

        HttpResponse.success(res, {
          list: [],  // 实际使用时应该是查询结果
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
          },
          sort: {
            field: sort,
            order: order === 'desc' ? 'desc' : 'asc'
          }
        });
      }, 'example.list')
    }
  ]
}