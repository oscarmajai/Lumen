import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const companyRepository = {
  async create({ name, slug }) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO companies (id, name, slug) VALUES (?, ?, ?)',
      [id, name, slug]
    );
    return { id, name, slug, is_active: 1 };
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE id = ? AND is_active = 1',
      [id]
    );
    return rows[0] ?? null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE slug = ?',
      [slug]
    );
    return rows[0] ?? null;
  },
};
