import { getAgriWisdom } from './ai.js';

export function extractKeywords(text) {
  const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);

  const words = text
    .replace(/[，。！？；：""''（）【】《》、]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));

  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export async function organizeWisdomText(rawText) {
  const keywords = extractKeywords(rawText);

  const prompt = `请将以下农事经验整理成结构化的内容，包括标题和详细描述：\n\n${rawText}`;

  try {
    const organized = await getAgriWisdom(prompt);

    const lines = organized.split('\n').filter(line => line.trim());
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || rawText.slice(0, 30);
    const content = lines.slice(1).join('\n').trim() || rawText;

    return {
      title,
      content,
      keywords
    };
  } catch (error) {
    return {
      title: rawText.slice(0, 30),
      content: rawText,
      keywords
    };
  }
}

export function calculatePoints(actionType, data = {}) {
  const pointsMap = {
    'record_wisdom': 10,
    'add_audio': 15,
    'add_image': 5,
    'receive_favorite': 3,
    'receive_share': 5,
    'daily_login': 2,
    'first_contribution': 20
  };

  let points = pointsMap[actionType] || 0;

  if (actionType === 'record_wisdom' && data.hasAudio) {
    points += 5;
  }
  if (actionType === 'record_wisdom' && data.hasImages) {
    points += data.imageCount * 2;
  }

  return points;
}
