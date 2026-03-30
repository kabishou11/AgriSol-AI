// Air Quality routes
export default async function airQualityRoutes(fastify) {
  // Current air quality
  fastify.get('/api/airquality', async (request, reply) => {
    const { city = '寿光' } = request.query || {};
    return {
      success: true,
      data: {
        city,
        aqi: 50,
        level: '优',
        pm25: 25,
        pm10: 40,
        co: 0.4,
        no2: 20,
        o3: 60,
        so2: 10
      },
      message: 'ok'
    };
  });

  // Air quality history
  fastify.get('/api/airquality/history', async (request, reply) => {
    return {
      success: true,
      data: [],
      message: 'ok'
    };
  });
}
