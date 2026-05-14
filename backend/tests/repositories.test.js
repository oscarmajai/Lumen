import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockExecute, mockQuery } = vi.hoisted(() => ({
  mockExecute: vi.fn(async () => [[{ id: 'row-1' }]]),
  mockQuery:   vi.fn(async () => [[{ id: 'row-1' }]]),
}));

vi.mock('../db/pool.js', () => ({
  pool: { execute: mockExecute, query: mockQuery },
}));

const { chatSessionRepository } = await import('../repositories/chat-session.repository.js');
const { chatMessageRepository } = await import('../repositories/chat-message.repository.js');

function resetMocks() {
  mockExecute.mockReset();
  mockQuery.mockReset();
  mockExecute.mockResolvedValue([[{ id: 'row-1' }]]);
  mockQuery.mockResolvedValue([[{ id: 'row-1' }]]);
}

// ─── chatSessionRepository.findAllByUser ──────────────────────────────────────
describe('chatSessionRepository.findAllByUser — corrección LIMIT/OFFSET', () => {
  beforeEach(resetMocks);

  it('usa pool.query (protocolo texto), NO pool.execute', async () => {
    await chatSessionRepository.findAllByUser('c1', 'u1', 20, 0);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(0);
  });

  it('pasa LIMIT y OFFSET como números', async () => {
    await chatSessionRepository.findAllByUser('c1', 'u1', 10, 5);
    const params = mockQuery.mock.calls[0][1];
    expect(params[2]).toBe(10);
    expect(params[3]).toBe(5);
  });

  it('incluye companyId y userId en los params de la query', async () => {
    await chatSessionRepository.findAllByUser('comp-abc', 'user-xyz', 20, 0);
    const params = mockQuery.mock.calls[0][1];
    expect(params[0]).toBe('comp-abc');
    expect(params[1]).toBe('user-xyz');
  });
});

// ─── chatMessageRepository.findBySession ──────────────────────────────────────
describe('chatMessageRepository.findBySession — corrección LIMIT/OFFSET', () => {
  beforeEach(() => {
    resetMocks();
    mockQuery.mockResolvedValue([[{ id: 'msg-1', metadata: null }]]);
  });

  it('usa pool.query (protocolo texto), NO pool.execute', async () => {
    await chatMessageRepository.findBySession('sess-1', 100, 0);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(0);
  });

  it('pasa LIMIT y OFFSET como números', async () => {
    await chatMessageRepository.findBySession('sess-1', 50, 10);
    const params = mockQuery.mock.calls[0][1];
    expect(params[1]).toBe(50);
    expect(params[2]).toBe(10);
  });
});

// ─── chatSessionRepository.create ─────────────────────────────────────────────
describe('chatSessionRepository.create', () => {
  beforeEach(() => {
    resetMocks();
    mockExecute.mockResolvedValue([{}]);
  });

  it('devuelve dify_conversation_id del parámetro cuando se proporciona', async () => {
    const result = await chatSessionRepository.create({
      companyId: 'c1', userId: 'u1', title: 'Test',
      difyConversationId: 'dify-conv-abc',
    });
    expect(result.dify_conversation_id).toBe('dify-conv-abc');
  });

  it('devuelve null cuando difyConversationId no se pasa', async () => {
    const result = await chatSessionRepository.create({
      companyId: 'c1', userId: 'u1', title: 'Nueva',
    });
    expect(result.dify_conversation_id).toBeNull();
  });

  it('incluye todos los campos de identidad en el resultado', async () => {
    const result = await chatSessionRepository.create({
      companyId: 'c1', userId: 'u1', title: 'Sesión',
    });
    expect(result.id).toBeTruthy();
    expect(result.company_id).toBe('c1');
    expect(result.user_id).toBe('u1');
    expect(result.title).toBe('Sesión');
  });
});

// ─── chatMessageRepository.create ────────────────────────────────────────────
describe('chatMessageRepository.create', () => {
  beforeEach(() => {
    resetMocks();
    mockExecute.mockResolvedValue([{}]);
  });

  it('usa pool.execute para inserts', async () => {
    await chatMessageRepository.create({ sessionId: 's1', role: 'user', content: 'Hola' });
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('serializa metadata como JSON', async () => {
    const meta = { tokens: 42, response_ms: 300 };
    await chatMessageRepository.create({ sessionId: 's1', role: 'assistant', content: 'ok', metadata: meta });
    const params = mockExecute.mock.calls[0][1];
    expect(typeof params[4]).toBe('string');
    expect(JSON.parse(params[4])).toEqual(meta);
  });

  it('pasa null cuando metadata es undefined', async () => {
    await chatMessageRepository.create({ sessionId: 's1', role: 'user', content: 'msg' });
    const params = mockExecute.mock.calls[0][1];
    expect(params[4]).toBeNull();
  });
});
