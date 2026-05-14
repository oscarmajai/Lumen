import { areasService } from '../services/areas.service.js';

export const areasController = {
  async list(request, reply) {
    try {
      const { companyId, role, areaIds } = request.user;
      return reply.send({ areas: await areasService.list({ companyId, role, areaIds }) });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async getById(request, reply) {
    try {
      const area = await areasService.getById({ id: request.params.id, companyId: request.user.companyId });
      return reply.send({ area });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async create(request, reply) {
    try {
      const area = await areasService.create({ companyId: request.user.companyId, ...request.body });
      return reply.status(201).send({ area });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async update(request, reply) {
    try {
      await areasService.update({ id: request.params.id, companyId: request.user.companyId, ...request.body });
      return reply.send({ message: 'Área actualizada' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },
};
