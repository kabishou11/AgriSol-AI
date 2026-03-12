import OpenAI from 'openai';
import config from '../config.js';

const client = new OpenAI({
  apiKey: config.modelScopeApiKey,
  baseURL: 'https://api-inference.modelscope.cn/v1'
});

export async function analyzeCropImage(imageBase64, cropType) {
  if (!config.modelScopeApiKey) {
    return 'ModelScope API Key 未配置，无法进行AI分析';
  }

  try {
    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen3.5-122B-A10B',  // 支持多模态
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `请分析这张${cropType}作物图片的健康状况、病虫害情况，并给出专业的农业建议。` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI analysis error:', error);
    return `AI分析暂时不可用：${error.message}`;
  }
}

export async function getAgriWisdom(question) {
  if (!config.modelScopeApiKey) {
    return 'Unable to provide answer at this time';
  }

  try {
    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen3.5-122B-A10B',
      messages: [
        { role: 'system', content: '你是专业的农业专家，提供实用的农业种植建议。请用简洁、专业、友好的中文回答。' },
        { role: 'user', content: question }
      ],
      max_tokens: 800,
      temperature: 0.7
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI wisdom error:', error);
    return 'Unable to provide answer at this time';
  }
}
