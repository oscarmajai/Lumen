export const registerSchema = {
  body: {
    type: 'object',
    required: ['company_name', 'admin_name', 'email', 'password'],
    properties: {
      company_name: { type: 'string', minLength: 2, maxLength: 255 },
      admin_name:   { type: 'string', minLength: 2, maxLength: 255 },
      email:        { type: 'string', format: 'email' },
      password:     { type: 'string', minLength: 8, maxLength: 100 },
    },
    additionalProperties: false,
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'company_slug'],
    properties: {
      email:        { type: 'string', format: 'email' },
      password:     { type: 'string' },
      company_slug: { type: 'string', minLength: 2, maxLength: 100 },
    },
    additionalProperties: false,
  },
};

export const refreshSchema = {
  body: {
    type: 'object',
    required: ['refresh_token'],
    properties: {
      refresh_token: { type: 'string' },
    },
    additionalProperties: false,
  },
};

export const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['current_password', 'new_password'],
    properties: {
      current_password: { type: 'string' },
      new_password:     { type: 'string', minLength: 8, maxLength: 100 },
    },
    additionalProperties: false,
  },
};
