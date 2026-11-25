import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import connectSessionSequelize from 'connect-session-sequelize';
import { config } from './config';
import { sequelize } from './db';
import { migrate } from './migrate';
import { User, Priority } from './models';
import { authRouter } from './auth.routes';
import { apiRouter } from './api.routes';
import { filesRouter } from './files.routes';
import { errorHandler } from './errors';
import { requireAuth, requireCsrf } from './middleware';

const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({
  db: sequelize,
  expiration: 100 * 365 * 24 * 60 * 60 * 1000,
  checkExpirationInterval: 0,
  tableName: 'sesiones',
});

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.NODE_ENV === 'production' ? 1 : false);
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    name: 'nexo.sid',
    secret: config.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.NODE_ENV === 'production',
      maxAge: 100 * 365 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.get('/api/salud', (_req, res) => res.json({ estado: 'ok' }));
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false }),
  authRouter,
);
app.use('/api', requireAuth, (req, res, next) =>
  ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.path.startsWith('/auth/')
    ? requireCsrf(req, res, next)
    : next(),
);
app.use('/api', apiRouter);
app.use('/api/archivos', filesRouter);
app.use((_req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }));
app.use(errorHandler);

async function initialize(): Promise<void> {
  await sequelize.authenticate();
  await migrate();
  await sessionStore.sync();
  if (!(await User.findOne())) {
    await User.create({
      username: config.INITIAL_USERNAME,
      email: config.INITIAL_EMAIL.toLowerCase(),
      passwordHash: await bcrypt.hash(config.INITIAL_PASSWORD, 12),
      recoveryHash: null,
      recoveryExpiresAt: null,
    });
  }
  if ((await Priority.count()) === 0) {
    await Priority.bulkCreate(
      ['Urgente', 'Alta', 'Media', 'Baja', 'Sin prioridad'].map((nombre, index) => ({
        nombre,
        orden: index + 1,
      })),
    );
  }
}

if (require.main === module) {
  initialize()
    .then(() =>
      app.listen(config.PORT, () =>
        console.info(`API Nexo Notarial escuchando en puerto ${config.PORT}`),
      ),
    )
    .catch((error: unknown) => {
      console.error('No fue posible iniciar Nexo Notarial.', error);
      process.exitCode = 1;
    });
}
