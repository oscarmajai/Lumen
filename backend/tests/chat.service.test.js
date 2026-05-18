import { vi, describe, it, expect, beforeEach } from 'vitest';

const DIFY_ANSWER = 'Respuesta de prueba de Dify';

const { mockKBRepo, mockSessionRepo, mockMessageRepo, mockDify } = vi.hoisted(() => {
  const mockKBRepo = {
    findByAreaIds: vi.fn(async () => [
      { dify_dataset_id: 'ds1' },
      { dify_dataset_id: 'ds2' },
    ]),
  };

  const mockSessionRepo = {
    create: vi.fn(async ({ companyId, userId, title }) => ({
      id: 'sess-new',
      company_id: companyId,
      user_id: userId,
      title: title ?? 'Nueva conversación',
      dify_conversation_id: null,
    })),
    findById:                 vi.fn(async () => null),
    updateDifyConversationId: vi.fn(async () => {}),
    touch:                    vi.fn(async () => {}),
    findAllByUser:            vi.fn(async () => []),
    deleteById:               vi.fn(async () => {}),
  };

  const mockMessageRepo = {
    create:        vi.fn(async (d) => ({ id: 'msg-1', ...d })),
    findBySession: vi.fn(async () => []),
  };

  const mockDify = {
    chat: vi.fn(async () => ({
      answer:               'Respuesta de prueba de Dify',
      conversation_id:      'dify-conv-123',
      usage:                null,
      retriever_resources:  [
        {
          document_name: 'manual.pdf',
          content:       'fragmento relevante',
          score:         0.95,
          dataset_name:  'RRHH',
          document_id:   'doc-xyz',
        },
      ],
    })),
    chatStream:    vi.fn(),
    stopGenerate:  vi.fn(async () => {}),
    previewFile:   vi.fn(async () => ({ stream: null, contentType: 'application/pdf', contentDisposition: null })),
  };

  return { mockKBRepo, mockSessionRepo, mockMessageRepo, mockDify };
});

vi.mock('../repositories/knowledge-base.repository.js', () => ({
  knowledgeBaseRepository: mockKBRepo,
}));
vi.mock('../repositories/chat-session.repository.js', () => ({
  chatSessionRepository: mockSessionRepo,
}));
vi.mock('../repositories/chat-message.repository.js', () => ({
  chatMessageRepository: mockMessageRepo,
}));
vi.mock('../services/dify.service.js', () => ({
  difyService: mockDify,
}));

const { chatService } = await import('../services/chat.service.js');

// ─── sendMessage ──────────────────────────────────────────────────────────────
describe('chatService.sendMessage', () => {
  beforeEach(() => {
    mockSessionRepo.create.mockReset();
    mockSessionRepo.findById.mockReset();
    mockSessionRepo.updateDifyConversationId.mockReset();
    mockSessionRepo.touch.mockReset();
    mockMessageRepo.create.mockReset();
    mockDify.chat.mockReset();

    mockSessionRepo.create.mockImplementation(async ({ companyId, userId, title }) => ({
      id: 'sess-new', company_id: companyId, user_id: userId,
      title: title ?? 'Nueva conversación', dify_conversation_id: null,
    }));
    mockSessionRepo.findById.mockResolvedValue(null);
    mockSessionRepo.updateDifyConversationId.mockResolvedValue();
    mockSessionRepo.touch.mockResolvedValue();
    mockMessageRepo.create.mockResolvedValue({ id: 'msg-1' });
    mockDify.chat.mockResolvedValue({
      answer:              DIFY_ANSWER,
      conversation_id:     'dify-conv-123',
      usage:               null,
      retriever_resources: [
        {
          document_name: 'manual.pdf', content: 'fragmento relevante',
          score: 0.95, dataset_name: 'RRHH', document_id: 'doc-xyz',
        },
      ],
    });
  });

  it('crea nueva sesión cuando no se pasa sessionId', async () => {
    const result = await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'Hola Lumen',
    });
    expect(mockSessionRepo.create).toHaveBeenCalledTimes(1);
    expect(result.session_id).toBe('sess-new');
  });

  it('devuelve la respuesta de Dify', async () => {
    const result = await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'Test',
    });
    expect(result.answer).toBe(DIFY_ANSWER);
  });

  it('pasa los datasetIds de las áreas autorizadas a Dify', async () => {
    await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'test',
    });
    const chatArgs = mockDify.chat.mock.calls[0][0];
    expect(chatArgs.datasetIds).toEqual(['ds1', 'ds2']);
  });

  it('mapea citations incluyendo document_id y file_type', async () => {
    const result = await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'test',
    });
    expect(result.citations).toHaveLength(1);
    const cit = result.citations[0];
    expect(cit.document_name).toBe('manual.pdf');
    expect(cit.file_type).toBe('pdf');
    expect(cit.document_id).toBe('doc-xyz');
    expect(cit.score).toBe(0.95);
    expect(cit.dataset_name).toBe('RRHH');
  });

  it('lanza 404 cuando la sesión existente no se encuentra', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);
    await expect(
      chatService.sendMessage({
        userId: 'u1', companyId: 'c1', areaIds: [],
        message: 'Hola', sessionId: 'inexistente',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('usa sesión existente sin crear una nueva', async () => {
    const existingSession = {
      id: 'sess-existing', company_id: 'c1', user_id: 'u1',
      dify_conversation_id: 'old-conv',
    };
    mockSessionRepo.findById.mockResolvedValue(existingSession);

    await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'continuar', sessionId: 'sess-existing',
    });

    expect(mockSessionRepo.create).toHaveBeenCalledTimes(0);
    const chatArgs = mockDify.chat.mock.calls[0][0];
    expect(chatArgs.conversationId).toBe('old-conv');
  });

  it('actualiza dify_conversation_id cuando es nueva sesión', async () => {
    await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'inicio',
    });
    expect(mockSessionRepo.updateDifyConversationId).toHaveBeenCalledTimes(1);
    const [sessId, , convId] = mockSessionRepo.updateDifyConversationId.mock.calls[0];
    expect(sessId).toBe('sess-new');
    expect(convId).toBe('dify-conv-123');
  });

  it('guarda mensaje del usuario y respuesta del asistente en DB', async () => {
    await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'mensaje de prueba',
    });
    expect(mockMessageRepo.create).toHaveBeenCalledTimes(2);
    const [userMsg, assistantMsg] = mockMessageRepo.create.mock.calls.map(c => c[0]);
    expect(userMsg.role).toBe('user');
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.content).toBe(DIFY_ANSWER);
  });

  it('no llama updateDifyConversationId si la sesión ya tenía conversation_id', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 'sess-x', dify_conversation_id: 'existing-conv',
    });
    await chatService.sendMessage({
      userId: 'u1', companyId: 'c1', areaIds: ['a1'],
      message: 'continuar', sessionId: 'sess-x',
    });
    expect(mockSessionRepo.updateDifyConversationId).toHaveBeenCalledTimes(0);
  });
});

// ─── getSessions ──────────────────────────────────────────────────────────────
describe('chatService.getSessions', () => {
  it('delega en chatSessionRepository.findAllByUser', async () => {
    mockSessionRepo.findAllByUser.mockReset();
    mockSessionRepo.findAllByUser.mockResolvedValue([{ id: 's1' }]);
    const result = await chatService.getSessions({ companyId: 'c1', userId: 'u1', page: 1, limit: 5 });
    expect(result).toHaveLength(1);
    expect(mockSessionRepo.findAllByUser).toHaveBeenCalledTimes(1);
  });
});

// ─── stopGenerate ─────────────────────────────────────────────────────────────
describe('chatService.stopGenerate', () => {
  it('delega en difyService.stopGenerate con taskId y userId', async () => {
    mockDify.stopGenerate.mockReset();
    mockDify.stopGenerate.mockResolvedValue();
    await chatService.stopGenerate({ taskId: 'task-123', userId: 'u1' });
    expect(mockDify.stopGenerate).toHaveBeenCalledTimes(1);
    const args = mockDify.stopGenerate.mock.calls[0][0];
    expect(args.taskId).toBe('task-123');
    expect(args.userId).toBe('u1');
  });
});
