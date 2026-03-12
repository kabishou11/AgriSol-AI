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

export async function analyzeCropImageStructured(imageBase64, userNote = '') {
  if (!config.modelScopeApiKey) {
    return null;
  }

  try {
    let promptText = '请分析这张作物图片，识别作物类型、生长阶段、病虫害情况，并评估健康状况。';

    if (userNote) {
      promptText += `\n\n用户说明：${userNote}\n请特别关注用户提到的问题。`;
    }

    promptText += '\n\n返回JSON格式：{"cropType":"作物名","growthStage":"生长期","pests":[{"name":"病虫害名","severity":"low/medium/high"}],"healthScore":85,"summary":"简要总结作物状况（2-3句话）","detailedAnalysis":"详细分析报告（包括作物识别、健康评估、病虫害分析、生长建议等，200字左右）"}';

    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen3.5-122B-A10B',
      messages: [
        {
          role: 'system',
          content: '你是专业的农业图像分析专家。请分析作物图片并返回JSON格式的结构化数据，包含：cropType(作物类型)、growthStage(生长阶段)、pests(病虫害数组)、healthScore(健康评分0-100)、summary(简要总结)、detailedAnalysis(详细分析报告)。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI structured analysis error:', error);
    return null;
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
