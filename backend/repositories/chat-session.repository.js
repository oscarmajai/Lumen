import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const chatSessionRepository = {
  async create({ companyId, userId, title, difyConversationId }) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO chat_sessions (id, company_id, user_id, title, dify_conversation_id) VALUES (?, ?, ?, ?, ?)',
      [id, companyId, userId, title ?? 'Nueva conversación', difyConversationId ?? null]
    );
    return { id, company_id: companyId, user_id: userId, title, dify_conversation_id: difyConversationId ?? null };
  },

  async findById(id, companyId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM chat_sessions WHERE id = ? AND company_id = ? AND user_id = ?',
      [id, companyId, userId]
    );
    return rows[0] ?? null;
  },

  async findAllByUser(companyId, userId, limit = 50, offset = 0) {
    // pool.query (text protocol) avoids the mysql2 prepared-statement bug where
    // JS numbers are sent as DOUBLE and MySQL rejects them for LIMIT/OFFSET.
    const [rows] = await pool.query(
      'SELECT * FROM chat_sessions WHERE company_id = ? AND user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      [companyId, userId, Number(limit), Number(offset)]
    );
    return rows;
  },

  async updateDifyConversationId(id, companyId, difyConversationId) {
    await pool.execute(
      'UPDATE chat_sessions SET dify_conversation_id = ?, updated_at = NOW() WHERE id = ? AND company_id = ?',
      [difyConversationId, id, companyId]
    );
  },

  async touch(id) {
    await pool.execute(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?',
      [id]
    );
  },

  async deleteById(id, companyId, userId) {
    await pool.execute(
      'DELETE FROM chat_sessions WHERE id = ? AND company_id = ? AND user_id = ?',
      [id, companyId, userId]
    );
  },
};
