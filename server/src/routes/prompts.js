import db from '../database.js';
import { getAllPromptPresets, getPromptsByCategory, fillPromptVariables, getAllSystemPrompts } from '../services/prompt-manager.js';
import { getAgriWisdom } from '../services/ai.js';

export default async function promptRoutes(fastify) {

  // 获取所有系统提示词
  fastify.get('/api/prompts/system', async (request, reply) => {
    try {
      const systemPrompts = getAllSystemPrompts();
      return { success: true, data: systemPrompts };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 获取所有预设提示词
  fastify.get('/api/prompts/presets', async (request, reply) => {
    try {
      const { category } = request.query;
      const presets = category ? getPromptsByCategory(category) : getAllPromptPresets();
      return { success: true, data: presets };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 获取用户自定义提示词
  fastify.get('/api/prompts/custom', async (request, reply) => {
    try {
      const userId = 1;
      const prompts = db.prepare(`
        SELECT * FROM custom_prompts WHERE user_id = ? ORDER BY created_at DESC
      `).all(userId);
      return { success: true, data: prompts };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 创建自定义提示词
  fastify.post('/api/prompts/custom', async (request, reply) => {
    try {
      const userId = 1;
      const { name, category, template, variables } = request.body;

      if (!name || !template) {
        return reply.code(400).send({ success: false, message: '名称和模板不能为空' });
      }

      const result = db.prepare(`
        INSERT INTO custom_prompts (user_id, name, category, template, variables)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, name, category || '自定义', template, JSON.stringify(variables || []));

      return { success: true, id: result.lastInsertRowid, message: '提示词创建成功' };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 更新自定义提示词
  fastify.put('/api/prompts/custom/:id', async (request, reply) => {
    try {
      const userId = 1;
      const { id } = request.params;
      const { name, category, template, variables } = request.body;

      const result = db.prepare(`
        UPDATE custom_prompts SET name = ?, category = ?, template = ?, variables = ?
        WHERE id = ? AND user_id = ?
      `).run(name, category, template, JSON.stringify(variables || []), id, userId);

      if (result.changes === 0) {
        return reply.code(404).send({ success: false, message: '提示词不存在或无权限' });
      }

      return { success: true, message: '提示词更新成功' };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 删除自定义提示词
  fastify.delete('/api/prompts/custom/:id', async (request, reply) => {
    try {
      const userId = 1;
      const { id } = request.params;
      const result = db.prepare('DELETE FROM custom_prompts WHERE id = ? AND user_id = ?').run(id, userId);

      if (result.changes === 0) {
        return reply.code(404).send({ success: false, message: '提示词不存在或无权限' });
      }

      return { success: true, message: '提示词删除成功' };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 填充提示词变量并返回
  fastify.post('/api/prompts/fill', async (request, reply) => {
    try {
      const { template, variables } = request.body;
      const filled = fillPromptVariables(template, variables || {});
      return { success: true, data: { filled } };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // AI生成提示词
  fastify.post('/api/prompts/generate', async (request, reply) => {
    try {
      const { purpose, context } = request.body;

      if (!purpose) {
        return reply.code(400).send({ success: false, message: '请描述提示词用途' });
      }

      const generatePrompt = `请为以下场景生成一个专业的AI系统提示词（system prompt）：

用途：${purpose}
${context ? `背景信息：${context}` : ''}

要求：
1. 明确AI的角色定位和专业领域
2. 列出AI的核心能力（3-5项）
3. 说明回答时的注意事项
4. 语言简洁专业，适合作为系统提示词
5. 字数控制在200-300字

请直接输出提示词内容，不要包含其他说明文字。`;

      const generated = await getAgriWisdom(generatePrompt);

      if (!generated || generated === 'Unable to provide answer at this time') {
        return reply.code(503).send({ success: false, message: 'AI服务暂时不可用' });
      }

      return { success: true, data: { prompt: generated } };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });
}
