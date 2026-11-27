import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { QueryTypes } from 'sequelize';
import { sequelize } from './db';

export async function migrate(): Promise<void> {
  const name = '001_initial.sql';
  const sql = await readFile(path.resolve(process.cwd(), 'db', 'migrations', name), 'utf8');
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(200) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const applied = await sequelize.query<{ name: string }>(
    'SELECT name FROM schema_migrations WHERE name = :name',
    { replacements: { name }, type: QueryTypes.SELECT },
  );
  if (applied.length) return;
  await sequelize.transaction(async (transaction) => {
    await sequelize.query(sql, { transaction });
    await sequelize.query('INSERT INTO schema_migrations(name) VALUES (:name)', {
      replacements: { name },
      transaction,
    });
  });
}
