import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { User } from '../models';
import { config, mailConfigured } from '../config';
import { issueCsrf, requireAuth, requireCsrf } from '../middleware/security';
import { httpError } from '../middleware/error-handler';
import { z } from 'zod';

export const authRouter = Router();
const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const user = await User.findOne({
      where: { [Op.or]: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    );
    req.session.userId = user.id;
    issueCsrf(req, res);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId!, {
      attributes: ['id', 'username', 'email'],
    });
    if (!user) throw httpError(401, 'La sesión ya no es válida.');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/csrf', requireAuth, issueCsrf);
authRouter.post('/logout', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((error) => (error ? reject(error) : resolve())),
    );
    res.clearCookie('nexo.sid');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

const recoveryRequestSchema = z.object({ email: z.string().email().max(254) });
authRouter.post('/recuperacion', async (req, res, next) => {
  try {
    if (!mailConfigured)
      throw httpError(
        503,
        'La recuperación por correo no está disponible: falta configurar el proveedor SMTP.',
      );
    const { email } = recoveryRequestSchema.parse(req.body);
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      user.recoveryHash = createHash('sha256').update(token).digest('hex');
      user.recoveryExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
      });
      const link = `${config.PUBLIC_APP_URL}/restablecer?token=${encodeURIComponent(token)}`;
      await transporter.sendMail({
        from: config.SMTP_FROM,
        to: user.email,
        subject: 'Recuperación de acceso a Nexo Notarial',
        text: `Usá este enlace por 30 minutos: ${link}`,
      });
    }
    res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/restablecer', async (req, res, next) => {
  try {
    const schema = z.object({
      token: z.string().length(64),
      password: z.string().min(12).max(200),
    });
    const { token, password } = schema.parse(req.body);
    const digest = createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      where: { recoveryHash: digest, recoveryExpiresAt: { [Op.gt]: new Date() } },
    });
    if (!user) throw httpError(400, 'El enlace venció o ya fue utilizado.');
    user.passwordHash = await bcrypt.hash(password, 12);
    user.recoveryHash = null;
    user.recoveryExpiresAt = null;
    await user.save();
    res.json({ mensaje: 'La contraseña se actualizó correctamente.' });
  } catch (error) {
    next(error);
  }
});
