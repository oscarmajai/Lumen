export const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'role'],
    properties: {
      name:     { type: 'string', minLength: 2, maxLength: 255 },
      email:    { type: 'string', format: 'email' },
      role:     { type: 'string', enum: ['ADMIN', 'EMPLOYEE'] },
      area_ids: { type: 'array', items: { type: 'string' }, default: [] },
    },
    additionalProperties: false,
  },
};

export const updateUserSchema = {
  body: {
    type: 'object',
    properties: {
      name:      { type: 'string', minLength: 2, maxLength: 255 },
      role:      { type: 'string', enum: ['ADMIN', 'EMPLOYEE'] },
      is_active: { type: 'boolean' },
      area_ids:  { type: 'array', items: { type: 'string' } },
    },
    additionalProperties: false,
  },
};
