import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const areaRepository = {
  async create({ companyId, name, description }) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO areas (id, company_id, name, description) VALUES (?, ?, ?, ?)',
      [id, companyId, name, description ?? null]
    );
    return { id, company_id: companyId, name, description: description ?? null };
  },

  async findById(id, companyId) {
    const [rows] = await pool.execute(
      'SELECT * FROM areas WHERE id = ? AND company_id = ? AND is_active = 1',
      [id, companyId]
    );
    return rows[0] ?? null;
  },

  async findAllByCompany(companyId) {
    const [rows] = await pool.execute(
      'SELECT * FROM areas WHERE company_id = ? AND is_active = 1 ORDER BY name ASC',
      [companyId]
    );
    return rows;
  },

  async findByIds(ids, companyId) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT * FROM areas WHERE id IN (${placeholders}) AND company_id = ? AND is_active = 1 ORDER BY name ASC`,
      [...ids, companyId]
    );
    return rows;
  },

  async update(id, companyId, fields) {
    const allowed = ['name', 'description', 'is_active'];
    const setClauses = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!setClauses.length) return;
    values.push(id, companyId);
    await pool.execute(
      `UPDATE areas SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ? AND company_id = ?`,
      values
    );
  },
};
