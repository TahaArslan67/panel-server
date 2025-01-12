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
  throw new Error('MONGODB_URI is not defined in environment variables');
}

mongoose.set('strictQuery', true);

// MongoDB bağlantı yönetimi
let cachedConnection: typeof mongoose | null = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Cached MongoDB bağlantısı kullanılıyor');
    return cachedConnection;
  }

  try {
    console.log('Yeni MongoDB bağlantısı başlatılıyor...');
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      maxPoolSize: 1
    });
    
    console.log('MongoDB bağlantısı başarılı!');
    cachedConnection = conn;
    return conn;
  } catch (error: any) {
    console.error('MongoDB bağlantı hatası:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    throw error;
  }
};

// Root endpoint - Hızlı yanıt
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Panel API is running' });
});

// Health check endpoint - Hızlı yanıt
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
  try {
    // Hızlı endpoint'ler için özel kontrol
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

    // Diğer endpoint'ler için MongoDB bağlantısı gerekli
    if (!cachedConnection) {
      await connectDB();
    }

    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
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