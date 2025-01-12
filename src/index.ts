import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();

// CORS ayarları
const corsOptions = {
  origin: '*',  // Tüm originlere izin ver
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB bağlantı ayarları
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

// MongoDB bağlantı yönetimi
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      maxPoolSize: 1
    });
    return conn;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
};

// Basit endpoint'ler
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Panel API is running' });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    status: err.status || 500,
    path: req.path
  });
});

// Vercel için handler
const handler = async (req: express.Request, res: express.Response) => {
  // Basit endpoint'ler için hızlı yanıt
  if (req.url === '/' || req.url === '/health') {
    return app(req, res);
  }

  try {
    // MongoDB bağlantısı gerektiren endpoint'ler için
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
};

// Development ortamında normal Express sunucusu olarak çalıştır
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5001;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }).catch(console.error);
}

export default handler;