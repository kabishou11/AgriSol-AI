// Solar / Photovoltaic routes - extended energy data
export default async function solarRoutes(fastify) {
  // Solar panel overview
  fastify.get('/api/solar/overview', async (request, reply) => {
    const userId = Number(request.query?.userId || 1);
    return {
      success: true,
      data: {
        totalCapacity: 0,
        dailyGeneration: 0,
        monthlyGeneration: 0,
        efficiency: 0,
        panels: []
      },
      message: 'ok'
    };
  });

  // Solar statistics
  fastify.get('/api/solar/statistics', async (request, reply) => {
    return {
      success: true,
      data: {
        avgDailyGeneration: 0,
        peakHour: 0,
        totalGeneration: 0,
        trend: []
      },
      message: 'ok'
    };
  });
}
