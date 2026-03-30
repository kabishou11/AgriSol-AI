// Agriculture routes - extended crop/farm data
export default async function agricultureRoutes(fastify) {
  // Farm overview
  fastify.get('/api/agriculture/overview', async (request, reply) => {
    const userId = Number(request.query?.userId || 1);
    return {
      success: true,
      data: {
        totalArea: 0,
        crops: [],
        status: 'idle'
      },
      message: 'ok'
    };
  });

  // Agricultural activities
  fastify.get('/api/agriculture/activities', async (request, reply) => {
    return {
      success: true,
      data: [],
      message: 'ok'
    };
  });
}
