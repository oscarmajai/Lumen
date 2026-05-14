export function authorize(...roles) {
  return async (request, reply) => {
    if (!roles.includes(request.user?.role)) {
      return reply.status(403).send({ error: 'Permisos insuficientes' });
    }
  };
}
