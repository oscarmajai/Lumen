import { vi, describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET         = 'test-jwt-secret-at-least-32-chars!!';
const REFRESH_SECRET = 'test-refresh-secret-at-least-32!!';

vi.mock('../config/index.js', () => ({
  config: { JWT_SECRET: SECRET, JWT_REFRESH_SECRET: REFRESH_SECRET },
}));

const { authenticate } = await import('../middlewares/authenticate.js');
const { authorize }    = await import('../middlewares/authorize.js');
const { tenantScope }  = await import('../middlewares/tenant-scope.js');

function makeReply() {
  const r = { _code: 200, _body: null };
  r.status = (code) => { r._code = code; return r; };
  r.send   = (body) => { r._body = body; return r; };
  return r;
}

// ─── authenticate ─────────────────────────────────────────────────────────────
describe('authenticate', () => {
  it('401 — sin header Authorization', async () => {
    const req = { headers: {} };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(401);
    expect(rep._body.error).toBe('Token requerido');
  });

  it('401 — esquema distinto de Bearer', async () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(401);
  });

  it('401 — token malformado', async () => {
    const req = { headers: { authorization: 'Bearer not.a.jwt' } };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(401);
    expect(rep._body.error).toBe('Token inválido o expirado');
  });

  it('401 — token expirado', async () => {
    const token = jwt.sign({ userId: 'u1' }, SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(401);
  });

  it('401 — firmado con secret incorrecto', async () => {
    const token = jwt.sign({ userId: 'u1' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(401);
  });

  it('pasa y popula request.user con token válido', async () => {
    const payload = { userId: 'u1', companyId: 'c1', role: 'ADMIN', areaIds: ['a1'] };
    const token = jwt.sign(payload, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const rep = makeReply();
    await authenticate(req, rep);
    expect(rep._code).toBe(200);
    expect(rep._body).toBeNull();
    expect(req.user.userId).toBe('u1');
    expect(req.user.companyId).toBe('c1');
    expect(req.user.role).toBe('ADMIN');
    expect(req.user.areaIds).toEqual(['a1']);
  });
});

// ─── authorize ────────────────────────────────────────────────────────────────
describe('authorize', () => {
  it('no hace nada cuando el rol está permitido', async () => {
    const req = { user: { role: 'ADMIN' } };
    const rep = makeReply();
    await authorize('ADMIN', 'OWNER')(req, rep);
    expect(rep._code).toBe(200);
    expect(rep._body).toBeNull();
  });

  it('403 cuando el rol no está en la lista', async () => {
    const req = { user: { role: 'EMPLOYEE' } };
    const rep = makeReply();
    await authorize('ADMIN', 'OWNER')(req, rep);
    expect(rep._code).toBe(403);
    expect(rep._body.error).toBeTruthy();
  });

  it('403 cuando request.user es undefined', async () => {
    const req = { user: undefined };
    const rep = makeReply();
    await authorize('ADMIN')(req, rep);
    expect(rep._code).toBe(403);
  });
});

// ─── tenantScope ──────────────────────────────────────────────────────────────
describe('tenantScope', () => {
  it('pasa cuando no hay param companyId', async () => {
    const req = { params: {}, user: { companyId: 'c1' } };
    const rep = makeReply();
    await tenantScope(req, rep);
    expect(rep._code).toBe(200);
    expect(rep._body).toBeNull();
  });

  it('pasa cuando companyId del param coincide con el token', async () => {
    const req = { params: { companyId: 'c1' }, user: { companyId: 'c1' } };
    const rep = makeReply();
    await tenantScope(req, rep);
    expect(rep._code).toBe(200);
  });

  it('403 cuando companyId del param NO coincide', async () => {
    const req = { params: { companyId: 'c-otro' }, user: { companyId: 'c1' } };
    const rep = makeReply();
    await tenantScope(req, rep);
    expect(rep._code).toBe(403);
    expect(rep._body.error).toBeTruthy();
  });
});
