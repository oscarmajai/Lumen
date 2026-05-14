import { knowledgeBaseRepository } from '../repositories/knowledge-base.repository.js';
import { areaRepository } from '../repositories/area.repository.js';

export const knowledgeBasesController = {
  async list(request, reply) {
    try {
      const kbs = await knowledgeBaseRepository.findAllByCompany(request.user.companyId);
      return reply.send({ knowledge_bases: kbs });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async create(request, reply) {
    try {
      const { area_id, dify_dataset_id, name } = request.body;
      const area = await areaRepository.findById(area_id, request.user.companyId);
      if (!area) return reply.status(404).send({ error: 'Área no encontrada' });

      const kb = await knowledgeBaseRepository.create({
        companyId: request.user.companyId,
        areaId: area_id,
        difyDatasetId: dify_dataset_id,
        name,
      });
      return reply.status(201).send({ knowledge_base: kb });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async remove(request, reply) {
    try {
      await knowledgeBaseRepository.deleteById(request.params.id, request.user.companyId);
      return reply.send({ message: 'Eliminado correctamente' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },
};
