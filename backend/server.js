import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Middlewares
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Routers
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import facultyRouter from './routes/faculty.js';
import studentRouter from './routes/student.js';
import aiRouter from './routes/ai.js';

// DB Initializer
import { initDb } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets if in production (we will build the client here later)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/student', studentRouter);
app.use('/api/ai', aiRouter);

// Fallback for SPA routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
  });
}

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Auto-run DB initialization, then start listening
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`\n⚡[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🤖[AI Assistant] Interface is live!`);
    });
  } catch (err) {
    console.error('Failed to bootstrap database. Server startup aborted.', err.message);
    process.exit(1);
  }
};

startServer();
