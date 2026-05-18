import { areaRepository } from '../repositories/area.repository.js';

export const areasService = {
  async create({ companyId, name, description }) {
    return areaRepository.create({ companyId, name, description });
  },

  async list({ companyId, role, areaIds }) {
    if (role === 'EMPLOYEE') {
      if (!areaIds?.length) return [];
      return areaRepository.findByIds(areaIds, companyId);
    }
    return areaRepository.findAllByCompany(companyId);
  },

  async getById({ id, companyId }) {
    const area = await areaRepository.findById(id, companyId);
    if (!area) throw Object.assign(new Error('Área no encontrada'), { statusCode: 404 });
    return area;
  },

  async update({ id, companyId, ...fields }) {
    await this.getById({ id, companyId });
    await areaRepository.update(id, companyId, fields);
  },
};
