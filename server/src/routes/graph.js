import db from '../database.js';

// Knowledge graph: builds nodes and edges from all platform data
// Node types: crop, energy, environment, carbon, wisdom, concept
// Edges: semantic relationships between entities

const CATEGORY_COLORS = {
  crop: '#4ade80',       // green
  energy: '#facc15',     // yellow
  environment: '#60a5fa', // blue
  carbon: '#34d399',     // emerald
  wisdom: '#f472b6',     // pink
  concept: '#a78bfa',    // purple
  tag: '#fb923c'         // orange
};

function buildGraph() {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map(); // key -> node id

  let idCounter = 1;
  const addNode = (key, label, category, value = 1, extra = {}) => {
    if (nodeMap.has(key)) return nodeMap.get(key);
    const id = String(idCounter++);
    nodes.push({ id, name: label, category, value, symbolSize: Math.min(10 + value * 3, 60), ...extra });
    nodeMap.set(key, id);
    return id;
  };
  const addEdge = (source, target, label = '', weight = 1) => {
    if (source && target && source !== target) {
      edges.push({ source, target, label, lineStyle: { width: Math.min(weight, 4) } });
    }
  };

  // === Core concept nodes ===
  const coreNodes = [
    { key: 'agrivoltaic', label: '农光互补', category: 'concept' },
    { key: 'carbon_neutral', label: '碳中和', category: 'concept' },
    { key: 'smart_agri', label: '智慧农业', category: 'concept' },
    { key: 'eco_env', label: '生态环境', category: 'concept' },
    { key: 'rural_vitalize', label: '乡村振兴', category: 'concept' }
  ];
  coreNodes.forEach(n => addNode(n.key, n.label, n.category, 5));

  // Core concept relationships
  addEdge(nodeMap.get('agrivoltaic'), nodeMap.get('carbon_neutral'), '促进', 3);
  addEdge(nodeMap.get('agrivoltaic'), nodeMap.get('smart_agri'), '赋能', 3);
  addEdge(nodeMap.get('smart_agri'), nodeMap.get('eco_env'), '监测', 2);
  addEdge(nodeMap.get('carbon_neutral'), nodeMap.get('eco_env'), '改善', 2);
  addEdge(nodeMap.get('rural_vitalize'), nodeMap.get('agrivoltaic'), '依托', 2);
  addEdge(nodeMap.get('rural_vitalize'), nodeMap.get('smart_agri'), '推动', 2);

  // === Wisdom records ===
  try {
    const wisdomRecords = db.prepare(`
      SELECT id, title, category, tags, favorite_count, view_count
      FROM wisdom_records ORDER BY favorite_count DESC LIMIT 20
    `).all();

    wisdomRecords.forEach(r => {
      const nodeId = addNode(`wisdom_${r.id}`, r.title.slice(0, 12), 'wisdom',
        1 + Math.floor((r.favorite_count + r.view_count) / 10));

      // Connect to smart_agri
      addEdge(nodeId, nodeMap.get('smart_agri'), '经验');

      // Parse tags and create tag nodes
      let tags = [];
      try { tags = JSON.parse(r.tags || '[]'); } catch { tags = r.tags ? r.tags.split(',').map(t => t.trim()) : []; }

      tags.slice(0, 3).forEach(tag => {
        if (!tag) return;
        const tagId = addNode(`tag_${tag}`, tag, 'tag', 2);
        addEdge(nodeId, tagId, '标签');
        // Connect tags to concepts
        if (['水稻', '小麦', '玉米', '蔬菜', '茶叶'].some(c => tag.includes(c))) {
          addEdge(tagId, nodeMap.get('smart_agri'), '属于');
        }
        if (['节气', '农历', '传统'].some(c => tag.includes(c))) {
          addEdge(tagId, nodeMap.get('rural_vitalize'), '传承');
        }
      });

      // Category connections
      if (r.category === 'planting' || r.category === 'pest' || r.category === 'harvest') {
        addEdge(nodeId, nodeMap.get('smart_agri'), '指导');
      }
    });
  } catch {}

  // === Crop records ===
  try {
    const cropTypes = db.prepare(`
      SELECT crop_type, COUNT(*) as cnt, AVG(health_score) as avg_health
      FROM crop_records GROUP BY crop_type ORDER BY cnt DESC LIMIT 8
    `).all();

    cropTypes.forEach(r => {
      const nodeId = addNode(`crop_${r.crop_type}`, r.crop_type, 'crop',
        Math.floor(r.cnt / 2) + 1);
      addEdge(nodeId, nodeMap.get('smart_agri'), '监测');
      addEdge(nodeId, nodeMap.get('agrivoltaic'), '种植');

      // Low health crops connect to environment
      if (r.avg_health < 70) {
        addEdge(nodeId, nodeMap.get('eco_env'), '受影响');
      }
    });
  } catch {}

  // === Energy records ===
  try {
    const energySummary = db.prepare(`
      SELECT SUM(generation) as total_gen, SUM(consumption) as total_con,
             COUNT(*) as records
      FROM energy_records
    `).get();

    if (energySummary?.total_gen > 0) {
      const energyId = addNode('energy_solar', '光伏发电', 'energy', 4);
      addEdge(energyId, nodeMap.get('agrivoltaic'), '核心');
      addEdge(energyId, nodeMap.get('carbon_neutral'), '减排');

      const selfRate = energySummary.total_gen > 0
        ? Math.min(energySummary.total_con / energySummary.total_gen, 1) : 0;
      if (selfRate > 0.5) {
        const storageId = addNode('energy_storage', '储能系统', 'energy', 2);
        addEdge(energyId, storageId, '配合');
      }
    }
  } catch {}

  // === Environment records ===
  try {
    const envSummary = db.prepare(`
      SELECT AVG(soil_ph) as ph, AVG(soil_organic_matter) as organic,
             AVG(biodiversity_score) as bio, AVG(environmental_score) as score
      FROM environment_records
    `).get();

    if (envSummary?.ph) {
      const soilId = addNode('env_soil', '土壤健康', 'environment', 3);
      const waterId = addNode('env_water', '水资源', 'environment', 3);
      const bioId = addNode('env_bio', '生物多样性', 'environment', 2);

      addEdge(soilId, nodeMap.get('eco_env'), '构成');
      addEdge(waterId, nodeMap.get('eco_env'), '构成');
      addEdge(bioId, nodeMap.get('eco_env'), '构成');
      addEdge(soilId, nodeMap.get('smart_agri'), '基础');

      // Connect soil to crops
      const cropNodes = [...nodeMap.entries()].filter(([k]) => k.startsWith('crop_'));
      cropNodes.slice(0, 3).forEach(([, id]) => addEdge(soilId, id, '影响'));
    }
  } catch {}

  // === Carbon records ===
  try {
    const carbonSummary = db.prepare(`
      SELECT SUM(carbon_sequestered) as total, COUNT(*) as cnt,
             crop_type
      FROM carbon_records GROUP BY crop_type ORDER BY total DESC LIMIT 5
    `).all();

    carbonSummary.forEach(r => {
      const nodeId = addNode(`carbon_${r.crop_type}`, `${r.crop_type}碳汇`, 'carbon', 2);
      addEdge(nodeId, nodeMap.get('carbon_neutral'), '贡献');
      // Connect to matching crop node
      const cropKey = `crop_${r.crop_type}`;
      if (nodeMap.has(cropKey)) {
        addEdge(nodeMap.get(cropKey), nodeId, '产生');
      }
    });
  } catch {}

  return { nodes, edges, categories: Object.entries(CATEGORY_COLORS).map(([name, color]) => ({ name, itemStyle: { color } })) };
}

export default async function graphRoutes(fastify) {
  fastify.get('/api/graph/knowledge', async () => {
    return buildGraph();
  });

  // Get node detail when clicked
  fastify.get('/api/graph/node/:type/:id', async (request, reply) => {
    const { type, id } = request.params;

    try {
      if (type === 'wisdom') {
        const record = db.prepare('SELECT * FROM wisdom_records WHERE id = ?').get(parseInt(id));
        if (!record) return reply.status(404).send({ error: 'Not found' });
        let tags = [];
        try { tags = JSON.parse(record.tags || '[]'); } catch { tags = record.tags ? record.tags.split(',') : []; }
        return { type: 'wisdom', data: { ...record, tags } };
      }
      if (type === 'crop') {
        const records = db.prepare('SELECT * FROM crop_records WHERE crop_type = ? ORDER BY created_at DESC LIMIT 5').all(id);
        return { type: 'crop', data: records };
      }
    } catch {}

    return { type, id, data: null };
  });
}
