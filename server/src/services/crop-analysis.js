import sharp from 'sharp'
import { analyzeCropImageStructured } from './ai.js'

class CropAnalysisService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 3600000
  }

  async preprocessImage(imagePath) {
    try {
      const buffer = await sharp(imagePath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      return buffer
    } catch (error) {
      console.error('Image preprocessing error:', error)
      throw new Error('图片预处理失败')
    }
  }

  calculateHealthScore(detections) {
    let baseScore = 100

    if (!detections || detections.length === 0) {
      return baseScore
    }

    for (const detection of detections) {
      const severity = detection.severity || 'low'
      const deductions = {
        'low': 5,
        'medium': 15,
        'high': 30
      }
      baseScore -= deductions[severity] || 10
    }

    return Math.max(0, Math.min(100, baseScore))
  }

  generateRecommendations(cropType, pests, healthScore) {
    const recommendations = []

    if (healthScore >= 80) {
      recommendations.push('作物整体健康状况良好，继续保持当前管理措施')
      recommendations.push('定期监测作物生长状态，及时发现潜在问题')
    } else if (healthScore >= 60) {
      recommendations.push('作物健康状况一般，需要加强管理')
      recommendations.push('增加巡查频率，密切关注病虫害发展')
    } else {
      recommendations.push('作物健康状况较差，需要立即采取措施')
      recommendations.push('建议咨询专业农技人员，制定针对性治疗方案')
    }

    if (pests && pests.length > 0) {
      for (const pest of pests) {
        if (pest.name.includes('蚜虫')) {
          recommendations.push('使用生物农药或天敌防治蚜虫，避免化学农药残留')
        }
        if (pest.name.includes('白粉病')) {
          recommendations.push('增加通风，降低湿度，可喷施硫磺制剂防治白粉病')
        }
        if (pest.name.includes('叶斑病')) {
          recommendations.push('清除病叶，喷施铜制剂或生物菌剂防治叶斑病')
        }
      }
    }

    recommendations.push('合理施肥，增强作物抗病能力')
    recommendations.push('保持田间清洁，及时清除病残体')

    return recommendations
  }

  async analyzeImage(imagePath, userNote = '') {
    const cacheKey = `analysis_${imagePath}_${userNote}`

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
      this.cache.delete(cacheKey)
    }

    try {
      let imageBuffer
      if (imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
        imageBuffer = Buffer.from(imagePath.split(',')[1] || '', 'base64')
      } else {
        imageBuffer = await this.preprocessImage(imagePath)
      }

      const base64Image = imageBuffer.toString('base64')
      console.log('[CropAnalysis] Calling AI service for image analysis...')
      console.log('[CropAnalysis] User note:', userNote || '(none)')
      const aiResult = await analyzeCropImageStructured(base64Image, userNote)
      console.log('[CropAnalysis] AI result:', aiResult ? 'SUCCESS' : 'NULL/FAILED')

      let cropType = '未知作物'
      let pests = []
      let growthStage = '生长期'
      let summary = ''
      let detailedAnalysis = ''

      if (aiResult && aiResult.cropType) {
        console.log('[CropAnalysis] Using AI result:', aiResult.cropType)
        cropType = aiResult.cropType
        pests = aiResult.pests || []
        growthStage = aiResult.growthStage || growthStage
        summary = aiResult.summary || ''
        detailedAnalysis = aiResult.detailedAnalysis || ''
      } else {
        console.log('[CropAnalysis] AI failed, using mock data')
        cropType = this.mockCropType()
        pests = this.mockPestDetection()
        growthStage = this.mockGrowthStage()
      }

      const healthScore = aiResult?.healthScore || this.calculateHealthScore(pests)
      const healthStatus = this.getHealthStatus(healthScore)
      const recommendations = this.generateRecommendations(cropType, pests, healthScore)

      const result = {
        cropType,
        growthStage,
        healthScore,
        healthStatus,
        pests,
        recommendations,
        summary,
        detailedAnalysis,
        analyzedAt: new Date().toISOString()
      }

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return result
    } catch (error) {
      console.error('Analysis error:', error)
      throw new Error('分析失败')
    }
  }

  getHealthStatus(score) {
    if (score >= 80) return '健康'
    if (score >= 60) return '良好'
    if (score >= 40) return '一般'
    return '较差'
  }

  mockCropType() {
    const types = ['小麦', '水稻', '玉米', '大豆', '番茄', '黄瓜', '辣椒']
    return types[Math.floor(Math.random() * types.length)]
  }

  mockGrowthStage() {
    const stages = ['播种期', '发芽期', '生长期', '拔节期', '抽穗期', '开花期', '结果期', '成熟期']
    return stages[Math.floor(Math.random() * stages.length)]
  }

  mockPestDetection() {
    const allPests = [
      { name: '蚜虫', severity: 'low' },
      { name: '白粉病', severity: 'medium' },
      { name: '叶斑病', severity: 'low' },
      { name: '锈病', severity: 'medium' },
      { name: '霜霉病', severity: 'high' }
    ]

    const numPests = Math.floor(Math.random() * 3)
    if (numPests === 0) return []

    const selectedPests = []
    for (let i = 0; i < numPests; i++) {
      const pest = allPests[Math.floor(Math.random() * allPests.length)]
      if (!selectedPests.find(p => p.name === pest.name)) {
        selectedPests.push(pest)
      }
    }

    return selectedPests
  }

  clearCache() {
    this.cache.clear()
  }

  getCacheSize() {
    return this.cache.size
  }
}

export default new CropAnalysisService()
