import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger, { requestLogger, errorLogger } from './logger.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import routineRouter from './routes/routine.js';
import completionsRouter from './routes/completions.js';
import tasksRouter from './routes/tasks.js';

const app = express();
const port = Number(process.env.PORT) || 8080;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/routine', routineRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/tasks', tasksRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorLogger);

app.listen(port, () => {
  logger.info('server started', { port, env: process.env.NODE_ENV || 'development' });
});
