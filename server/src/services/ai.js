import OpenAI from 'openai';
import config from '../config.js';

const client = new OpenAI({
  apiKey: config.modelScopeApiKey || config.openaiApiKey,
  baseURL: config.modelScopeApiKey ? 'https://api.modelscope.cn/v1' : undefined
});

export async function analyzeCropImage(imageBase64, cropType) {
  try {
    const response = await client.chat.completions.create({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyze this ${cropType} crop image for health, diseases, and recommendations.` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ]
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'Analysis unavailable';
  }
}

export async function getAgriWisdom(question) {
  try {
    const response = await client.chat.completions.create({
      model: 'qwen-max',
      messages: [
        { role: 'system', content: 'You are an agricultural expert providing practical farming advice.' },
        { role: 'user', content: question }
      ]
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI wisdom error:', error);
    return 'Unable to provide answer at this time';
  }
}
