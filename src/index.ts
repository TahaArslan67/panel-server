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

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB zaten bağlı');
    return true;
  }

  try {
    console.log('MongoDB bağlantısı başlatılıyor...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout süresini düşürdük
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5
    });
    console.log('MongoDB bağlantısı başarılı!');
    return true;
  } catch (error: any) {
    console.error('MongoDB bağlantı hatası:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return false;
  }
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Panel API is running' });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    database: {
      status: dbStatus[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
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
let isConnected = false;

const handler = async (req: express.Request, res: express.Response) => {
  try {
    if (!isConnected) {
      console.log('İlk bağlantı denemesi başlatılıyor...');
      isConnected = await connectDB();
      if (!isConnected) {
        console.error('Veritabanı bağlantısı başarısız oldu');
        return res.status(500).json({ error: 'Database connection failed' });
      }
    }

    // Root endpoint için özel kontrol
    if (req.url === '/') {
      return res.json({ status: 'ok', message: 'Panel API is running' });
    }

    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Development ortamında normal Express sunucusu olarak çalıştır
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5001;
  connectDB().then((connected) => {
    if (connected) {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }
  });
}

export default handler;