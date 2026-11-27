import { Sequelize } from 'sequelize';
import { config } from './config';

export const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  logging: config.NODE_ENV === 'development' ? false : false,
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
});
