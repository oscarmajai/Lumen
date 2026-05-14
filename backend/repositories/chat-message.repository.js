import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';

export const chatMessageRepository = {
  async create({ sessionId, role, content, metadata }) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO chat_messages (id, session_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)',
      [id, sessionId, role, content, metadata ? JSON.stringify(metadata) : null]
    );
    return { id, session_id: sessionId, role, content };
  },

  async findBySession(sessionId, limit = 100, offset = 0) {
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
      [sessionId, Number(limit), Number(offset)]
    );
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  },
};
