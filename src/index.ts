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
    ? 'https://panel-client-sigma.vercel.app'
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// CORS Preflight için özel middleware
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    console.log('Connecting to MongoDB...', { uri: MONGODB_URI.substring(0, 20) + '...' });
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      retryWrites: true
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    isConnected = false;
    
    // Vercel için özel hata mesajı
    if (process.env.VERCEL) {
      console.error('Vercel environment detected, additional debug info:', {
        mongoUri: MONGODB_URI.substring(0, 20) + '...',
        nodeEnv: process.env.NODE_ENV,
        error: err.message
      });
    }
    
    throw new Error(`Failed to connect to MongoDB: ${err.message}`);
  }
};

// Her istek öncesi MongoDB bağlantısını kontrol et
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      console.log('Attempting to establish MongoDB connection...');
      await connectDB();
    }
    next();
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    
    // Vercel için özel hata yanıtı
    if (process.env.VERCEL) {
      return res.status(503).json({ 
        message: 'Database connection error',
        error: error.message,
        env: process.env.NODE_ENV,
        vercel: true
      });
    }
    
    res.status(503).json({ 
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    dbStatus: isConnected ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// İlk bağlantıyı başlat
connectDB();

export default app;