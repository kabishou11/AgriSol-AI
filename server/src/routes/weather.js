// Weather routes - stub implementation
export default async function weatherRoutes(fastify) {
  // Weather data endpoint - returns mock data
  fastify.get('/api/weather', async (request, reply) => {
    const { city = '寿光' } = request.query || {};
    return {
      success: true,
      data: {
        city,
        temperature: 22,
        humidity: 65,
        description: '晴',
        windSpeed: 3.5,
        forecast: []
      },
      message: 'ok'
    };
  });
}
