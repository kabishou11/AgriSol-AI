/**
 * AgriSol-AI 完整示例数据生成脚本
 * 运行: node src/utils/seed-all.js
 */
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'agrisol.db'));

// 确保表存在
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    phone TEXT,
    location TEXT,
    farm_area REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crop_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    image_id INTEGER,
    crop_type TEXT NOT NULL,
    health_score REAL,
    health_status TEXT,
    growth_stage TEXT,
    pests_detected TEXT,
    recommendations TEXT,
    analysis_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS energy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    generation REAL NOT NULL,
    consumption REAL NOT NULL,
    grid_import REAL DEFAULT 0,
    grid_export REAL DEFAULT 0,
    battery_charge REAL DEFAULT 0,
    battery_discharge REAL DEFAULT 0,
    device_type TEXT
  );

  CREATE TABLE IF NOT EXISTS carbon_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    crop_type TEXT NOT NULL,
    planting_area REAL NOT NULL,
    area_unit TEXT DEFAULT 'mu',
    planting_duration INTEGER NOT NULL,
    carbon_sequestered REAL NOT NULL,
    equivalent_trees INTEGER NOT NULL,
    emission_reduction REAL NOT NULL,
    certificate_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS environment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    soil_ph REAL,
    soil_organic_matter REAL,
    soil_nitrogen REAL,
    soil_phosphorus REAL,
    soil_potassium REAL,
    water_usage REAL,
    biodiversity_score REAL,
    environmental_score REAL,
    monitoring_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS wisdom_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    audio_path TEXT,
    audio_duration INTEGER,
    image_paths TEXT,
    category TEXT DEFAULT 'general',
    tags TEXT,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    avatar TEXT,
    points INTEGER DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    action_type TEXT NOT NULL,
    action_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE DEFAULT 1,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'zh-CN',
    notifications INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_crop_user ON crop_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_crop_date ON crop_records(created_at);
  CREATE INDEX IF NOT EXISTS idx_energy_user ON energy_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_energy_date ON energy_records(timestamp);
  CREATE INDEX IF NOT EXISTS idx_carbon_user ON carbon_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_wisdom_category ON wisdom_records(category);
  CREATE INDEX IF NOT EXISTS idx_wisdom_date ON wisdom_records(created_at);
`);

console.log('✅ 数据库表创建完成');

// 清空旧数据
db.exec(`
  DELETE FROM activity_logs;
  DELETE FROM wisdom_records;
  DELETE FROM carbon_records;
  DELETE FROM environment_records;
  DELETE FROM energy_records;
  DELETE FROM crop_records;
  DELETE FROM family_members;
  DELETE FROM user_settings;
  DELETE FROM users;
`);

// 1. 创建默认用户
db.prepare(`
  INSERT INTO users (id, username, email, phone, location, farm_area)
  VALUES (1, '张大农', 'farmer@agrisol.ai', '13800138000', '湖南省长沙市', 50.5)
`).run();
console.log('✅ 用户创建完成');

// 2. 用户设置
db.prepare(`
  INSERT INTO user_settings (user_id, theme, language, notifications)
  VALUES (1, 'light', 'zh-CN', 1)
`).run();

// 3. 家庭成员
const familyData = [
  { name: '张大农', role: '户主', score: 1250 },
  { name: '李秀英', role: '配偶', score: 980 },
  { name: '张小明', role: '长子', score: 760 },
  { name: '张小红', role: '长女', score: 640 },
  { name: '王老汉', role: '父亲', score: 520 }
];
const insertFamily = db.prepare(`
  INSERT INTO family_members (name, role, points, contribution_count)
  VALUES (?, ?, ?, ?)
`);
familyData.forEach(m => insertFamily.run(m.name, m.role, m.score, Math.floor(m.score / 50)));
console.log('✅ 家庭成员创建完成');

// 4. 作物记录（30条，最近30天）
const cropTypes = ['水稻', '小麦', '玉米', '大豆', '蔬菜', '果树'];
const diseases = ['无', '无', '无', '稻瘟病', '白粉病', '蚜虫'];
const analyses = [
  '作物生长状态良好，叶片颜色正常，无明显病虫害迹象。建议保持当前管理方式，注意适时灌溉。',
  '发现轻微叶片黄化现象，可能与缺氮有关。建议适量追施氮肥，并加强水分管理。',
  '作物整体健康，但部分叶片出现斑点，疑似早期病害。建议及时喷施防治药剂。',
  '生长旺盛，叶色浓绿，根系发达。当前阶段需注意防止倒伏，可适当控制氮肥用量。',
  '发现少量害虫，建议采用生物防治方法，避免过度使用化学农药。'
];
const insertCrop = db.prepare(`
  INSERT INTO crop_records (user_id, crop_type, health_score, health_status, growth_stage, pests_detected, recommendations, analysis_data, created_at)
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now', ? || ' days'))
`);
for (let i = 0; i < 30; i++) {
  const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
  const healthScore = 60 + Math.random() * 38;
  const healthStatus = healthScore >= 85 ? '优秀' : healthScore >= 70 ? '良好' : '一般';
  const disease = diseases[Math.floor(Math.random() * diseases.length)];
  const analysis = analyses[Math.floor(Math.random() * analyses.length)];
  insertCrop.run(cropType, healthScore.toFixed(1), healthStatus, '生长期', disease, '定期检查，合理施肥，注意病虫害防治', JSON.stringify({ analysis }), `-${i}`);
}
console.log('✅ 作物记录创建完成（30条）');

// 5. 能源记录（30天）
const weatherConditions = ['晴天', '多云', '阴天', '小雨', '晴天', '晴天', '多云'];
const insertEnergy = db.prepare(`
  INSERT INTO energy_records (user_id, generation, consumption, grid_import, grid_export, battery_charge, device_type, timestamp)
  VALUES (1, ?, ?, ?, ?, ?, 'solar', datetime('now', ? || ' days'))
`);
for (let i = 0; i < 30; i++) {
  const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const baseGen = weather === '晴天' ? 28 : weather === '多云' ? 18 : weather === '阴天' ? 10 : 5;
  const generation = baseGen + (Math.random() - 0.5) * 6;
  const consumption = 15 + Math.random() * 10;
  const gridImport = Math.max(0, consumption - generation);
  const gridExport = Math.max(0, generation - consumption);
  const batteryCharge = Math.min(gridExport * 0.5, 5);
  insertEnergy.run(generation.toFixed(2), consumption.toFixed(2), gridImport.toFixed(2), gridExport.toFixed(2), batteryCharge.toFixed(2), `-${i}`);
}
console.log('✅ 能源记录创建完成（30条）');

// 6. 碳汇记录（10条）
const carbonCrops = ['水稻', '小麦', '玉米', '大豆', '蔬菜'];
const insertCarbon = db.prepare(`
  INSERT INTO carbon_records (user_id, crop_type, planting_area, area_unit, planting_duration, carbon_sequestered, equivalent_trees, emission_reduction, certificate_id, created_at)
  VALUES (1, ?, ?, 'mu', ?, ?, ?, ?, ?, datetime('now', ? || ' days'))
`);
for (let i = 0; i < 10; i++) {
  const crop = carbonCrops[Math.floor(Math.random() * carbonCrops.length)];
  const area = 5 + Math.random() * 20;
  const duration = 3 + Math.floor(Math.random() * 9);
  const sequestered = area * duration * 0.15 + Math.random() * 2;
  const trees = Math.floor(sequestered * 45);
  const reduction = sequestered * 0.8;
  const certId = `CERT-${Date.now()}-${i}`;
  insertCarbon.run(crop, area.toFixed(1), duration, sequestered.toFixed(2), trees, reduction.toFixed(2), certId, `-${i * 10}`);
}
console.log('✅ 碳汇记录创建完成（10条）');

// 7. 环境记录（20条）
const insertEnv = db.prepare(`
  INSERT INTO environment_records (user_id, soil_ph, soil_organic_matter, soil_nitrogen, soil_phosphorus, soil_potassium, water_usage, biodiversity_score, environmental_score, location, monitoring_date)
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, '湖南省长沙市', datetime('now', ? || ' days'))
`);
for (let i = 0; i < 20; i++) {
  const ph = 6.0 + Math.random() * 1.5;
  const organic = 2.0 + Math.random() * 2.0;
  const nitrogen = 80 + Math.random() * 60;
  const phosphorus = 15 + Math.random() * 20;
  const potassium = 100 + Math.random() * 80;
  const water = 200 + Math.random() * 300;
  const biodiversity = 60 + Math.random() * 35;
  const envScore = (ph / 7 * 20 + organic / 4 * 20 + biodiversity / 100 * 60).toFixed(1);
  insertEnv.run(ph.toFixed(1), organic.toFixed(1), nitrogen.toFixed(0), phosphorus.toFixed(0), potassium.toFixed(0), water.toFixed(0), biodiversity.toFixed(1), envScore, `-${i * 3}`);
}
console.log('✅ 环境记录创建完成（20条）');

// 8. 智慧记录（15条）
const wisdomData = [
  { title: '水稻插秧最佳时机', content: '根据多年经验，水稻插秧应在谷雨后5-7天进行，此时气温稳定在15℃以上，秧苗成活率最高。插秧深度以2-3厘米为宜，过深影响分蘖，过浅容易倒伏。', category: '种植经验', tags: '水稻,插秧,节气' },
  { title: '防治稻瘟病的土方法', content: '发现稻瘟病初期，可用草木灰撒施，每亩约50斤。草木灰含钾量高，能增强水稻抗病能力。同时注意排水，降低田间湿度，减少病菌传播。', category: '病虫害防治', tags: '水稻,稻瘟病,草木灰' },
  { title: '光伏板清洁小技巧', content: '光伏板每月至少清洁一次，用软布蘸清水擦拭即可。避免使用硬物刮擦，以免划伤表面。清洁时间选在早晨或傍晚，避免正午高温时清洁，防止热胀冷缩损坏面板。', category: '能源管理', tags: '光伏,清洁,维护' },
  { title: '玉米追肥的关键时期', content: '玉米追肥分三次：苗期追施提苗肥，拔节期追施攻秆肥，大喇叭口期追施攻穗肥。其中大喇叭口期是最关键的，此时追肥量占总追肥量的60%，对产量影响最大。', category: '种植经验', tags: '玉米,追肥,施肥' },
  { title: '判断土壤墒情的方法', content: '用手抓一把土，握紧后松开：土壤成团不散，说明水分充足；土壤成团后轻轻一碰就散，说明水分适中；土壤无法成团，说明需要灌溉。这是老一辈传下来的简单实用方法。', category: '土壤管理', tags: '土壤,墒情,灌溉' },
  { title: '二十四节气与农事安排', content: '春分种瓜，清明种豆，谷雨种棉，立夏种稻。这是祖辈总结的农事规律，与当地气候高度吻合。现在虽然有了气象预报，但节气仍是重要参考，特别是对于传统作物的种植时间。', category: '农事历法', tags: '节气,农事,传统' },
  { title: '蔬菜大棚温度管理', content: '冬季大棚温度管理：白天保持20-25℃，夜间不低于10℃。通风时间选在晴天上午10点到下午3点，避免冷风直吹作物。遇到寒潮天气，提前在棚内放置水桶，利用水的比热容稳定温度。', category: '种植经验', tags: '大棚,温度,蔬菜' },
  { title: '农药安全使用注意事项', content: '使用农药时必须穿戴防护装备，包括口罩、手套、防护服。施药后48小时内不得进入田间。农药包装袋不能随意丢弃，要集中处理。施药时间选在早晨或傍晚，避免高温时段，减少挥发和对人体的伤害。', category: '安全生产', tags: '农药,安全,防护' },
  { title: '稻田养鱼的好处', content: '稻田养鱼是传统的生态农业模式。鱼能吃掉杂草和害虫，鱼粪是天然肥料，减少化肥农药用量。每亩稻田可放养鲤鱼或草鱼100-150尾，既不影响水稻产量，还能增加额外收入。', category: '生态农业', tags: '稻田养鱼,生态,增收' },
  { title: '果树冬季修剪技术', content: '果树冬季修剪在落叶后到萌芽前进行，以疏剪为主，短截为辅。剪去病虫枝、交叉枝、过密枝。修剪后伤口要涂抹愈合剂，防止病菌侵入。修剪下来的枝条要及时清理，减少病虫害越冬基数。', category: '种植经验', tags: '果树,修剪,冬季' },
  { title: '雨水收集利用方法', content: '在屋顶安装导流槽，将雨水引入储水罐。储水罐容量建议5-10吨，可满足旱季灌溉需求。雨水收集不仅节约水资源，还能减少地表径流，防止水土流失。收集的雨水pH值接近中性，适合大多数作物灌溉。', category: '水资源管理', tags: '雨水收集,节水,灌溉' },
  { title: '大豆根瘤菌接种技术', content: '大豆播种前用根瘤菌剂拌种，可减少氮肥用量30-50%。拌种时避免阳光直射，拌好后立即播种。根瘤菌与大豆共生固氮，每亩可固定氮素10-15公斤，相当于施用30-45公斤尿素。', category: '种植经验', tags: '大豆,根瘤菌,固氮' },
  { title: '农业气象灾害预防', content: '关注天气预报，提前做好防灾准备。霜冻来临前，可在田间熏烟或灌水防霜。大风来临前，对高秆作物进行培土或支撑。暴雨前疏通排水沟，防止积水。这些传统方法简单有效，成本低廉。', category: '灾害防治', tags: '气象灾害,防霜,防涝' },
  { title: '有机肥的制作方法', content: '将秸秆、厨余垃圾、畜禽粪便按3:1:1比例混合，加入适量水分（手握成团，松开即散），堆成1.5米高的堆，用薄膜覆盖。每隔7-10天翻堆一次，约45-60天即可腐熟。腐熟的有机肥颜色深褐，无臭味，质地疏松。', category: '土壤管理', tags: '有机肥,堆肥,秸秆' },
  { title: '节气农谚的智慧', content: '"清明前后，种瓜点豆"、"谷雨前后，种花移树"、"立夏不下，犁耙高挂"。这些农谚是几千年农耕文明的结晶，蕴含着深刻的物候规律。虽然现代农业技术发达，但这些传统智慧仍有重要参考价值。', category: '农事历法', tags: '农谚,节气,传统智慧' }
];
const insertWisdom = db.prepare(`
  INSERT INTO wisdom_records (user_id, title, content, category, tags, favorite_count, view_count, created_at)
  VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now', ? || ' days'))
`);
wisdomData.forEach((w, i) => {
  const favorites = Math.floor(Math.random() * 50);
  const views = favorites * 3 + Math.floor(Math.random() * 100);
  insertWisdom.run(w.title, w.content, w.category, w.tags, favorites, views, `-${i * 5}`);
});
console.log('✅ 智慧记录创建完成（15条）');

// 9. 活动日志
const activities = [
  { type: 'crop_analyze', data: '分析了水稻健康状态' },
  { type: 'energy_record', data: '记录了今日发电量 28.5 kWh' },
  { type: 'carbon_calculate', data: '计算了大豆碳汇量 2.3 吨' },
  { type: 'wisdom_record', data: '录入了水稻插秧经验' },
  { type: 'environment_record', data: '记录了土壤检测数据' },
  { type: 'crop_analyze', data: '分析了玉米生长状态' },
  { type: 'energy_record', data: '记录了今日发电量 22.1 kWh' },
  { type: 'wisdom_record', data: '录入了防治稻瘟病方法' },
  { type: 'carbon_calculate', data: '计算了水稻碳汇量 3.1 吨' },
  { type: 'crop_analyze', data: '分析了蔬菜健康状态' }
];
const insertActivity = db.prepare(`
  INSERT INTO activity_logs (user_id, action_type, action_data, created_at)
  VALUES (1, ?, ?, datetime('now', ? || ' hours'))
`);
activities.forEach((a, i) => {
  insertActivity.run(a.type, a.data, `-${i * 3}`);
});
console.log('✅ 活动日志创建完成（10条）');

db.close();
console.log('\n🎉 所有示例数据创建完成！');
console.log('📊 数据统计：');
console.log('   - 用户：1个');
console.log('   - 家庭成员：5个');
console.log('   - 作物记录：30条');
console.log('   - 能源记录：30条');
console.log('   - 碳汇记录：10条');
console.log('   - 环境记录：20条');
console.log('   - 智慧记录：15条');
console.log('   - 活动日志：10条');
