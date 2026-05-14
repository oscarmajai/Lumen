import { difyService } from './dify.service.js';
import { config } from '../config/index.js';

export const documentsService = {
  async upload({ buffer, filename, datasetId }) {
    return difyService.uploadFile({ buffer, filename, datasetId: datasetId || config.DIFY_DATASET_ID });
  },

  async getStatus({ documentId, datasetId }) {
    return difyService.getDocumentStatus({ documentId, datasetId: datasetId || config.DIFY_DATASET_ID });
  },

  async list({ datasetId }) {
    return difyService.listDocuments(datasetId || config.DIFY_DATASET_ID);
  },
};
