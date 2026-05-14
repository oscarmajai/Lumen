export const sendMessageSchema = {
  body: {
    type: 'object',
    required: ['message'],
    properties: {
      message:    { type: 'string', minLength: 1, maxLength: 10000 },
      session_id: { type: 'string' },
    },
    additionalProperties: false,
  },
};
