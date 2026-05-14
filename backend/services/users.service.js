import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { pool } from '../db/pool.js';
import { userRepository } from '../repositories/user.repository.js';
import { areaRepository } from '../repositories/area.repository.js';

function generateTempPassword() {
  return randomBytes(8).toString('hex');
}

export const usersService = {
  async create({ companyId, name, email, role, area_ids = [] }) {
    for (const areaId of area_ids) {
      const area = await areaRepository.findById(areaId, companyId);
      if (!area) throw Object.assign(new Error(`Área ${areaId} no encontrada`), { statusCode: 400 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await userRepository.create({
      companyId,
      name,
      email,
      passwordHash,
      role,
      mustChangePassword: true,
    });

    if (area_ids.length) {
      const conn = await pool.getConnection();
      try {
        const values = area_ids.map(areaId => [user.id, areaId]);
        await conn.query('INSERT IGNORE INTO user_areas (user_id, area_id) VALUES ?', [values]);
      } finally {
        conn.release();
      }
    }

    return { ...user, temporary_password: tempPassword };
  },

  async list(companyId) {
    const users = await userRepository.findAllByCompany(companyId);
    const [areaRows] = await pool.execute(
      `SELECT ua.user_id, ua.area_id, a.name AS area_name
       FROM user_areas ua
       JOIN areas a ON a.id = ua.area_id
       WHERE a.company_id = ?`,
      [companyId]
    );
    return users.map(user => ({
      ...user,
      areas: areaRows.filter(r => r.user_id === user.id),
    }));
  },

  async update({ id, companyId, area_ids, ...fields }) {
    const user = await userRepository.findById(id, companyId);
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

    if (fields.role && user.role === 'OWNER' && fields.role !== 'OWNER') {
      throw Object.assign(new Error('No se puede cambiar el rol del OWNER'), { statusCode: 400 });
    }

    await userRepository.update(id, companyId, fields);

    if (area_ids !== undefined) {
      const conn = await pool.getConnection();
      try {
        await conn.execute('DELETE FROM user_areas WHERE user_id = ?', [id]);
        if (area_ids.length) {
          const values = area_ids.map(areaId => [id, areaId]);
          await conn.query('INSERT IGNORE INTO user_areas (user_id, area_id) VALUES ?', [values]);
        }
      } finally {
        conn.release();
      }
    }
  },
};
