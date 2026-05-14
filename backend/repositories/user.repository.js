import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const userRepository = {
  async create({ companyId, name, email, passwordHash, role, mustChangePassword = false }) {
    const id = randomUUID();
    await pool.execute(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, name, email, passwordHash, role, mustChangePassword ? 1 : 0]
    );
    return { id, company_id: companyId, name, email, role, must_change_password: mustChangePassword ? 1 : 0 };
  },

  async findByEmailAndCompany(email, companyId) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND company_id = ? AND is_active = 1 LIMIT 1',
      [email, companyId]
    );
    return rows[0] ?? null;
  },

  async findById(id, companyId) {
    const [rows] = await pool.execute(
      `SELECT id, company_id, name, email, role, must_change_password, is_active, created_at
       FROM users WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    return rows[0] ?? null;
  },

  async findByIdWithHash(id, companyId) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return rows[0] ?? null;
  },

  async findAllByCompany(companyId) {
    const [rows] = await pool.execute(
      `SELECT id, company_id, name, email, role, must_change_password, is_active, created_at
       FROM users WHERE company_id = ? ORDER BY created_at DESC`,
      [companyId]
    );
    return rows;
  },

  async updatePassword(id, companyId, passwordHash) {
    await pool.execute(
      'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ? AND company_id = ?',
      [passwordHash, id, companyId]
    );
  },

  async updateLastLogin(id) {
    await pool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [id]
    );
  },

  async update(id, companyId, fields) {
    const allowed = ['name', 'role', 'is_active'];
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
      `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ? AND company_id = ?`,
      values
    );
  },
};
