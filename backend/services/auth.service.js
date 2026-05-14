import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { companyRepository } from '../repositories/company.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { pool } from '../db/pool.js';

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 100);
}

function signAccess(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES_IN });
}

async function getAreaIds(userId) {
  const [rows] = await pool.execute(
    'SELECT area_id FROM user_areas WHERE user_id = ?',
    [userId]
  );
  return rows.map(r => r.area_id);
}

export const authService = {
  async register({ company_name, admin_name, email, password }) {
    const baseSlug = slugify(company_name);
    const existing = await companyRepository.findBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const company = await companyRepository.create({ name: company_name, slug });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      companyId: company.id,
      name: admin_name,
      email,
      passwordHash,
      role: 'OWNER',
    });

    return { company, user };
  },

  async login({ email, password, company_slug }) {
    const company = await companyRepository.findBySlug(company_slug);
    if (!company || !company.is_active) {
      throw Object.assign(new Error('Empresa no encontrada'), { statusCode: 401 });
    }

    const user = await userRepository.findByEmailAndCompany(email, company.id);
    if (!user) throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });

    if (!user.is_active) throw Object.assign(new Error('Cuenta desactivada'), { statusCode: 403 });

    await userRepository.updateLastLogin(user.id);

    const areaIds = await getAreaIds(user.id);
    const tokenPayload = {
      userId:    user.id,
      companyId: user.company_id,
      role:      user.role,
      areaIds,
    };

    return {
      access_token:         signAccess(tokenPayload),
      refresh_token:        signRefresh({ userId: user.id, companyId: user.company_id }),
      must_change_password: Boolean(user.must_change_password),
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        companyId: user.company_id,
        areaIds,
      },
    };
  },

  async refresh({ refresh_token }) {
    let payload;
    try {
      payload = jwt.verify(refresh_token, config.JWT_REFRESH_SECRET);
    } catch {
      throw Object.assign(new Error('Refresh token inválido'), { statusCode: 401 });
    }

    const user = await userRepository.findById(payload.userId, payload.companyId);
    if (!user?.is_active) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 401 });

    const areaIds = await getAreaIds(user.id);
    const tokenPayload = { userId: user.id, companyId: user.company_id, role: user.role, areaIds };

    return {
      access_token:  signAccess(tokenPayload),
      refresh_token: signRefresh({ userId: user.id, companyId: user.company_id }),
    };
  },

  async changePassword({ userId, companyId, currentPassword, newPassword }) {
    const user = await userRepository.findByIdWithHash(userId, companyId);
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { statusCode: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(userId, companyId, hash);
  },
};
