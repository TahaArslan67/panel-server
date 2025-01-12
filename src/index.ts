import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantı ayarları
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB zaten bağlı');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });

    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
};

// Routes
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Panel API is running' });
});

app.get('/health', async (_req, res) => {
  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    const dbStatus: { [key: number]: string } = {
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
        uri: MONGODB_URI.replace(/:[^:]*@/, ':****@')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

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

// Development ortamında normal Express sunucusu olarak çalıştır
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5001;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }).catch(console.error);
}

// Vercel için handler
const handler = async (req: express.Request, res: express.Response) => {
  try {
    // Root endpoint için özel kontrol
    if (req.url === '/') {
      return res.json({ status: 'ok', message: 'Panel API is running' });
    }

    // MongoDB bağlantısı
    await connectDB();
    
    // Express uygulamasını çalıştır
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message
    });
  }
};

export default handler;