import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();

// CORS ayarları
app.use(cors());
app.use(express.json());

// MongoDB bağlantı ayarları
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

// MongoDB bağlantı yönetimi
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');
    return conn;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
};

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Panel API is running' });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use((err: any, req: Request, res: Response) => {
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
const handler = async (req: Request, res: Response) => {
  try {
    // MongoDB bağlantısı
    await connectDB();
    
    // Express uygulamasını çalıştır
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
};

export default handler;