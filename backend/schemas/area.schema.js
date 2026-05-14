export const createAreaSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name:        { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
    },
    additionalProperties: false,
  },
};

export const updateAreaSchema = {
  body: {
    type: 'object',
    properties: {
      name:        { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      is_active:   { type: 'boolean' },
    },
    additionalProperties: false,
  },
};
