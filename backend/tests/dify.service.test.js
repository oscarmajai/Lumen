import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/index.js', () => ({
  config: {
    DIFY_API_URL:         'http://dify.test/v1',
    DIFY_CHAT_API_KEY:    'chat-key',
    DIFY_DATASET_API_KEY: 'dataset-key',
    DIFY_DATASET_ID:      'default-ds',
  },
}));

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet:  vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { create: () => ({ get: mockGet, post: mockPost }) },
}));

class MockFormData {
  constructor() { this.fields = {}; }
  append(name, value, opts) { this.fields[name] = { value, opts }; }
  getHeaders()              { return { 'content-type': 'multipart/form-data; boundary=X' }; }
  getLength(cb)             { cb(null, 512); }
}
vi.mock('form-data', () => ({ default: MockFormData }));

const { difyService, guessMime } = await import('../services/dify.service.js');

// ─── guessMime ────────────────────────────────────────────────────────────────
describe('guessMime', () => {
  const cases = [
    ['manual.pdf',  'application/pdf'],
    ['report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['data.xlsx',   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['notes.txt',   'text/plain'],
    ['README.md',   'text/markdown'],
    ['export.csv',  'text/csv'],
    ['archive.zip', 'application/octet-stream'],
    ['',            'application/octet-stream'],
  ];
  for (const [filename, expected] of cases) {
    it(`${filename || '(vacío)'} → ${expected}`, () => {
      expect(guessMime(filename)).toBe(expected);
    });
  }

  it('case-insensitive — MANUAL.PDF', () => {
    expect(guessMime('MANUAL.PDF')).toBe('application/pdf');
  });
});

// ─── uploadFile ───────────────────────────────────────────────────────────────
describe('difyService.uploadFile', () => {
  const DS_META = { indexing_technique: 'high_quality', doc_form: 'hierarchical_model' };

  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockGet.mockResolvedValue({ data: DS_META });
    mockPost.mockResolvedValue({
      data: { document: { id: 'doc-abc' }, batch: 'batch-1' },
    });
  });

  it('lanza 400 si el buffer está vacío', async () => {
    await expect(
      difyService.uploadFile({ buffer: Buffer.alloc(0), filename: 'a.pdf', datasetId: 'ds1' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('llama GET /datasets/:id primero para obtener metadatos', async () => {
    const buf = Buffer.from('contenido pdf');
    await difyService.uploadFile({ buffer: buf, filename: 'doc.pdf', datasetId: 'ds1' });
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toContain('ds1');
  });

  it('incluye name en el campo data', async () => {
    const buf = Buffer.from('hola mundo');
    await difyService.uploadFile({ buffer: buf, filename: 'notas.txt', datasetId: 'ds1' });
    const formInstance = mockPost.mock.calls[0][1];
    const dataField = JSON.parse(formInstance.fields.data.value);
    expect(dataField.name).toBe('notas.txt');
  });

  it('usa el indexing_technique y doc_form del dataset', async () => {
    const buf = Buffer.from('contenido');
    await difyService.uploadFile({ buffer: buf, filename: 'f.pdf', datasetId: 'ds1' });
    const formInstance = mockPost.mock.calls[0][1];
    const dataField = JSON.parse(formInstance.fields.data.value);
    expect(dataField.indexing_technique).toBe('high_quality');
    expect(dataField.doc_form).toBe('hierarchical_model');
  });

  it('pasa contentType y knownLength al append del archivo', async () => {
    const buf = Buffer.from('% PDF-1.4 contenido');
    await difyService.uploadFile({ buffer: buf, filename: 'file.pdf', datasetId: 'ds1' });
    const formInstance = mockPost.mock.calls[0][1];
    const fileField = formInstance.fields.file;
    expect(fileField.opts.contentType).toBe('application/pdf');
    expect(fileField.opts.knownLength).toBe(buf.length);
    expect(fileField.opts.filename).toBe('file.pdf');
  });

  it('envía maxBodyLength: Infinity', async () => {
    const buf = Buffer.from('data');
    await difyService.uploadFile({ buffer: buf, filename: 'f.txt', datasetId: 'ds1' });
    const axiosOpts = mockPost.mock.calls[0][2];
    expect(axiosOpts.maxBodyLength).toBe(Infinity);
  });

  it('usa mimetype del parámetro cuando se proporciona', async () => {
    const buf = Buffer.from('binary data');
    await difyService.uploadFile({
      buffer: buf, filename: 'archivo.bin',
      mimetype: 'application/pdf', datasetId: 'ds1',
    });
    const formInstance = mockPost.mock.calls[0][1];
    expect(formInstance.fields.file.opts.contentType).toBe('application/pdf');
  });

  it('devuelve document_id, batch y name', async () => {
    const buf = Buffer.from('data');
    const result = await difyService.uploadFile({ buffer: buf, filename: 'x.pdf', datasetId: 'ds1' });
    expect(result.document_id).toBe('doc-abc');
    expect(result.batch).toBe('batch-1');
    expect(result.name).toBe('x.pdf');
  });
});
