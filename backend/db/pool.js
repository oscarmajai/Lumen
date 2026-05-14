import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

export const pool = mysql.createPool({
  host:             config.DB_HOST,
  port:             config.DB_PORT,
  database:         config.DB_NAME,
  user:             config.DB_USER,
  password:         config.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '+00:00',
});
