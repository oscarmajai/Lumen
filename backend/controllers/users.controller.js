import { usersService } from '../services/users.service.js';

export const usersController = {
  async list(request, reply) {
    try {
      return reply.send({ users: await usersService.list(request.user.companyId) });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async create(request, reply) {
    try {
      const user = await usersService.create({ companyId: request.user.companyId, ...request.body });
      return reply.status(201).send({ user });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async update(request, reply) {
    try {
      await usersService.update({ id: request.params.id, companyId: request.user.companyId, ...request.body });
      return reply.send({ message: 'Usuario actualizado' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },
};
