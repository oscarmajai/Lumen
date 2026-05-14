const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Variable de entorno requerida faltante: ${key}`);
  return val;
};

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,

  DB_HOST:     process.env.DB_HOST || 'db',
  DB_PORT:     Number(process.env.DB_PORT) || 3306,
  DB_NAME:     required('MYSQL_DATABASE'),
  DB_USER:     required('MYSQL_USER'),
  DB_PASSWORD: required('MYSQL_PASSWORD'),

  JWT_SECRET:              required('JWT_SECRET'),
  JWT_REFRESH_SECRET:      required('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN:          process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN:  process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  DIFY_API_URL:         required('DIFY_API_URL'),
  DIFY_CHAT_API_KEY:    required('DIFY_CHAT_API_KEY'),
  DIFY_DATASET_API_KEY: required('DIFY_DATASET_API_KEY'),
  DIFY_DATASET_ID:      process.env.DIFY_DATASET_ID || null,
};
