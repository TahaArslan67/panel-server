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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://panel-client-sigma.vercel.app']
    : ['http://localhost:3000'],
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

// Global connection promise
let dbPromise: Promise<typeof mongoose> | null = null;

const connectDB = async () => {
  if (!dbPromise) {
    console.log('MongoDB bağlantısı başlatılıyor...');
    
    // Yeni bağlantı oluştur
    dbPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      maxPoolSize: 1,
      minPoolSize: 1,
      maxIdleTimeMS: 3000
    }).catch(err => {
      console.error('MongoDB bağlantı hatası:', err);
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
};

// Basit endpoint'ler - MongoDB bağlantısı gerektirmez
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
  if (req.url === '/') {
    return res.json({ status: 'ok', message: 'Panel API is running' });
  }
  if (req.url === '/health') {
    return res.json({
      status: 'ok',
      message: 'Server is running',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
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
  } finally {
    // Bağlantıyı kapat
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      dbPromise = null;
    }
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