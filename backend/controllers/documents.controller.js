import { documentsService } from '../services/documents.service.js';

export const documentsController = {
  async upload(request, reply) {
    try {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No se subió ningún archivo' });
      const buffer = await data.toBuffer();
      return reply.send(await documentsService.upload({
        buffer,
        filename:  data.filename,
        mimetype:  data.mimetype,
        datasetId: request.query.dataset_id,
      }));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async getStatus(request, reply) {
    try {
      return reply.send(await documentsService.getStatus({
        documentId: request.params.documentId,
        datasetId:  request.query.dataset_id,
      }));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async list(request, reply) {
    try {
      return reply.send(await documentsService.list({ datasetId: request.query.dataset_id }));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },
};
