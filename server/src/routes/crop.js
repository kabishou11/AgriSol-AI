import { pipeline } from 'stream'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import cropAnalysisService from '../services/crop-analysis.js'
import db from '../database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pump = promisify(pipeline)

export default async function cropRoutes(fastify, options) {
  const uploadDir = path.join(__dirname, '../../uploads/crops')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  fastify.post('/upload', async (request, reply) => {
    try {
      const data = await request.file()

      if (!data) {
        return reply.code(400).send({ error: '没有上传文件' })
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({ error: '不支持的文件类型' })
      }

      if (data.file.bytesRead > 10 * 1024 * 1024) {
        return reply.code(400).send({ error: '文件大小超过限制' })
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const filename = 'crop-' + uniqueSuffix + path.extname(data.filename)
      const filepath = path.join(uploadDir, filename)

      await pump(data.file, fs.createWriteStream(filepath))

      const imageUrl = `/uploads/crops/${filename}`
      const stats = fs.statSync(filepath)

      // 获取表单字段
      const fields = data.fields || {}
      const userNote = fields.note?.value || ''
      const cropType = fields.cropType?.value || ''

      const stmt = db.prepare(`
        INSERT INTO crop_images (filename, path, size, mimetype)
        VALUES (?, ?, ?, ?)
      `)
      const result = stmt.run(filename, imageUrl, stats.size, data.mimetype)
      const imageId = result.lastInsertRowid

      // 自动进行AI分析，传递用户说明
      console.log('[Upload] Starting AI analysis for:', filename)
      console.log('[Upload] User note:', userNote || '(none)')
      const analysisResult = await cropAnalysisService.analyzeImage(filepath, userNote)
      console.log('[Upload] AI analysis completed:', analysisResult.cropType)

      // 保存分析结果到数据库
      const analysisStmt = db.prepare(`
        INSERT INTO crop_records (
          image_id, crop_type, health_score, health_status,
          growth_stage, pests_detected, recommendations, analysis_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const analysisRecord = analysisStmt.run(
        imageId,
        analysisResult.cropType,
        analysisResult.healthScore,
        analysisResult.healthStatus,
        analysisResult.growthStage,
        JSON.stringify(analysisResult.pests),
        JSON.stringify(analysisResult.recommendations),
        JSON.stringify(analysisResult)
      )

      return {
        success: true,
        data: {
          id: imageId,
          url: imageUrl,
          filename: filename,
          recordId: analysisRecord.lastInsertRowid
        },
        ...analysisResult
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '上传失败' })
    }
  })

  fastify.post('/analyze', async (request, reply) => {
    try {
      const { image, imageId } = request.body

      if (!image && !imageId) {
        return reply.code(400).send({ error: '缺少图片信息' })
      }

      const analysisResult = await cropAnalysisService.analyzeImage(image || imageId)

      const stmt = db.prepare(`
        INSERT INTO crop_records (
          image_id, crop_type, health_score, health_status,
          growth_stage, pests_detected, recommendations, analysis_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        imageId || null,
        analysisResult.cropType,
        analysisResult.healthScore,
        analysisResult.healthStatus,
        analysisResult.growthStage,
        JSON.stringify(analysisResult.pests),
        JSON.stringify(analysisResult.recommendations),
        JSON.stringify(analysisResult)
      )

      return {
        success: true,
        data: {
          id: result.lastInsertRowid,
          ...analysisResult
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '分析失败' })
    }
  })

  fastify.get('/history', async (request, reply) => {
    try {
      const { page = 1, pageSize = 10, cropType, startDate, endDate } = request.query

      let query = `
        SELECT
          cr.id, cr.crop_type, cr.health_score, cr.health_status,
          cr.growth_stage, cr.created_at, ci.path as image_path
        FROM crop_records cr
        LEFT JOIN crop_images ci ON cr.image_id = ci.id
        WHERE 1=1
      `
      const params = []

      if (cropType) {
        query += ' AND cr.crop_type = ?'
        params.push(cropType)
      }

      if (startDate) {
        query += ' AND cr.created_at >= ?'
        params.push(startDate)
      }

      if (endDate) {
        query += ' AND cr.created_at <= ?'
        params.push(endDate)
      }

      query += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))

      const records = db.prepare(query).all(...params)

      const countQuery = `SELECT COUNT(*) as total FROM crop_records WHERE 1=1`
      const { total } = db.prepare(countQuery).get()

      return {
        success: true,
        data: {
          records,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total
          }
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '获取历史记录失败' })
    }
  })

  fastify.get('/statistics', async (request, reply) => {
    try {
      const stats = {
        totalAnalysis: db.prepare('SELECT COUNT(*) as count FROM crop_records').get().count,
        avgHealthScore: db.prepare('SELECT AVG(health_score) as avg FROM crop_records').get().avg || 0,
        cropTypes: db.prepare(`
          SELECT crop_type, COUNT(*) as count
          FROM crop_records
          GROUP BY crop_type
        `).all(),
        recentTrend: db.prepare(`
          SELECT
            DATE(created_at) as date,
            AVG(health_score) as avg_score,
            COUNT(*) as count
          FROM crop_records
          WHERE created_at >= date('now', '-7 days')
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all()
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '获取统计数据失败' })
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params

      const record = db.prepare('SELECT * FROM crop_records WHERE id = ?').get(id)
      if (!record) {
        return reply.code(404).send({ error: '记录不存在' })
      }

      db.prepare('DELETE FROM crop_records WHERE id = ?').run(id)

      return {
        success: true,
        message: '删除成功'
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '删除失败' })
    }
  })

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params

      const record = db.prepare(`
        SELECT
          cr.*,
          ci.path as image_path,
          ci.filename as image_filename
        FROM crop_records cr
        LEFT JOIN crop_images ci ON cr.image_id = ci.id
        WHERE cr.id = ?
      `).get(id)

      if (!record) {
        return reply.code(404).send({ error: '记录不存在' })
      }

      record.pests_detected = JSON.parse(record.pests_detected || '[]')
      record.recommendations = JSON.parse(record.recommendations || '[]')
      record.analysis_data = JSON.parse(record.analysis_data || '{}')

      return {
        success: true,
        data: record
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: '获取记录失败' })
    }
  })
}
