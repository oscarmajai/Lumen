import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token requerido' });
  }
  try {
    request.user = jwt.verify(authHeader.slice(7), config.JWT_SECRET);
  } catch {
    return reply.status(401).send({ error: 'Token inválido o expirado' });
  }
}
