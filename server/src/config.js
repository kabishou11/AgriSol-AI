import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default {
  port: process.env.PORT || 3010,
  host: process.env.HOST || '0.0.0.0',
  modelScopeApiKey: process.env.MODELSCOPE_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  dbPath: process.env.DB_PATH || './data/agrisol.db'
};
