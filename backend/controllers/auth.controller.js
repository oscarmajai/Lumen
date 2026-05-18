import { authService } from '../services/auth.service.js';

export const authController = {
  async register(request, reply) {
    try {
      const result = await authService.register(request.body);
      return reply.status(201).send({
        message: 'Empresa registrada correctamente',
        company: { id: result.company.id, name: result.company.name, slug: result.company.slug },
        user:    { id: result.user.id, email: result.user.email, role: result.user.role },
      });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async login(request, reply) {
    try {
      return reply.send(await authService.login(request.body));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async refresh(request, reply) {
    try {
      return reply.send(await authService.refresh(request.body));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async changePassword(request, reply) {
    try {
      await authService.changePassword({
        userId:          request.user.userId,
        companyId:       request.user.companyId,
        currentPassword: request.body.current_password,
        newPassword:     request.body.new_password,
      });
      return reply.send({ message: 'Contraseña actualizada' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async me(request, reply) {
    return reply.send({ user: request.user });
  },
};
