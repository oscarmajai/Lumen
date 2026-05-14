// Prevents IDOR: if a route exposes :companyId param, it must match the token's companyId.
export async function tenantScope(request, reply) {
  const paramCompanyId = request.params?.companyId;
  if (paramCompanyId && paramCompanyId !== request.user.companyId) {
    return reply.status(403).send({ error: 'Acceso denegado: recurso de otro tenant' });
  }
}
