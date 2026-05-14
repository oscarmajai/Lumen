import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const knowledgeBaseRepository = {
  async create({ companyId, areaId, difyDatasetId, name }) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO knowledge_bases (id, company_id, area_id, dify_dataset_id, name) VALUES (?, ?, ?, ?, ?)',
      [id, companyId, areaId, difyDatasetId, name]
    );
    return { id, company_id: companyId, area_id: areaId, dify_dataset_id: difyDatasetId, name };
  },

  async findByAreaIds(areaIds, companyId) {
    if (!areaIds.length) return [];
    const placeholders = areaIds.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT * FROM knowledge_bases WHERE area_id IN (${placeholders}) AND company_id = ? AND is_active = 1`,
      [...areaIds, companyId]
    );
    return rows;
  },

  async findByAreaId(areaId, companyId) {
    const [rows] = await pool.execute(
      'SELECT * FROM knowledge_bases WHERE area_id = ? AND company_id = ? AND is_active = 1',
      [areaId, companyId]
    );
    return rows;
  },

  async findAllByCompany(companyId) {
    const [rows] = await pool.execute(
      `SELECT kb.*, a.name AS area_name
       FROM knowledge_bases kb
       JOIN areas a ON a.id = kb.area_id
       WHERE kb.company_id = ? AND kb.is_active = 1
       ORDER BY a.name, kb.name`,
      [companyId]
    );
    return rows;
  },

  async deleteById(id, companyId) {
    await pool.execute(
      'UPDATE knowledge_bases SET is_active = 0 WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
  },
};
