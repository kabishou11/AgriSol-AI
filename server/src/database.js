import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, '../data');

mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(config.dbPath);

// 基础表结构初始化

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    crop_type TEXT NOT NULL,
    image_path TEXT,
    analysis_result TEXT,
    health_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS energy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    location TEXT NOT NULL,
    solar_potential REAL,
    wind_potential REAL,
    prediction_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS carbon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_type TEXT NOT NULL,
    carbon_amount REAL NOT NULL,
    calculation_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wisdom (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS carbon_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    crop_type TEXT NOT NULL,
    planting_area REAL NOT NULL,
    area_unit TEXT DEFAULT 'hectare',
    planting_duration INTEGER NOT NULL,
    carbon_sequestered REAL NOT NULL,
    equivalent_trees INTEGER NOT NULL,
    emission_reduction REAL NOT NULL,
    calculation_method TEXT,
    certificate_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS environment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    soil_ph REAL,
    soil_organic_matter REAL,
    soil_nitrogen REAL,
    soil_phosphorus REAL,
    soil_potassium REAL,
    water_usage REAL,
    water_efficiency REAL,
    biodiversity_score REAL,
    environmental_score REAL,
    monitoring_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS soil_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    environment_record_id INTEGER,
    ph_level REAL,
    moisture REAL,
    temperature REAL,
    organic_matter REAL,
    nitrogen REAL,
    phosphorus REAL,
    potassium REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (environment_record_id) REFERENCES environment_records(id)
  );

  CREATE TABLE IF NOT EXISTS water_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    environment_record_id INTEGER,
    irrigation_amount REAL,
    rainfall REAL,
    evapotranspiration REAL,
    efficiency_rate REAL,
    usage_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (environment_record_id) REFERENCES environment_records(id)
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'zh',
    notifications_enabled INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    privacy_level TEXT DEFAULT 'public',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL,
    action_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    report_type TEXT NOT NULL,
    report_period TEXT NOT NULL,
    report_data TEXT NOT NULL,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wisdom_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    audio_path TEXT,
    audio_duration INTEGER,
    image_paths TEXT,
    tags TEXT,
    category TEXT,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
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

  CREATE TABLE IF NOT EXISTS points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS wisdom_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wisdom_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wisdom_id) REFERENCES wisdom_records(id),
    FOREIGN KEY (member_id) REFERENCES family_members(id),
    UNIQUE(wisdom_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS energy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    generation REAL NOT NULL,
    consumption REAL NOT NULL,
    grid_import REAL DEFAULT 0,
    grid_export REAL DEFAULT 0,
    battery_charge REAL DEFAULT 0,
    battery_discharge REAL DEFAULT 0,
    device_type TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS energy_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    capacity REAL,
    status TEXT DEFAULT 'active',
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS crop_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER,
    mimetype TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crop_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_id INTEGER,
    crop_type TEXT NOT NULL,
    health_score REAL NOT NULL,
    health_status TEXT NOT NULL,
    growth_stage TEXT,
    pests_detected TEXT,
    recommendations TEXT,
    analysis_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES crop_images(id)
  );

  CREATE TABLE IF NOT EXISTS analysis_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_record_id INTEGER NOT NULL,
    result_type TEXT NOT NULL,
    result_data TEXT NOT NULL,
    confidence REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_record_id) REFERENCES crop_records(id)
  );

  CREATE INDEX IF NOT EXISTS idx_crop_records_created_at ON crop_records(created_at);
  CREATE INDEX IF NOT EXISTS idx_crop_records_crop_type ON crop_records(crop_type);
  CREATE INDEX IF NOT EXISTS idx_crop_records_health_score ON crop_records(health_score);
  CREATE INDEX IF NOT EXISTS idx_crop_images_uploaded_at ON crop_images(uploaded_at);

  CREATE TABLE IF NOT EXISTS custom_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    category TEXT DEFAULT '自定义',
    template TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// 最小增量索引：支持报表幂等查询

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_reports_user_type_period
  ON reports(user_id, report_type, report_period);
`);

export default db;
