import 'dotenv/config';

export default {
  port: process.env.PORT || 3010,
  host: process.env.HOST || '0.0.0.0',
  modelScopeApiKey: process.env.MODELSCOPE_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  dbPath: process.env.DB_PATH || './data/agrisol.db'
};
