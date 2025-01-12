import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// CORS ayarları
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://panel-client-sigma.vercel.app'
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB bağlantı ayarları
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB with URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    });
    console.log('MongoDB connected successfully');
  } catch (error: any) {
    console.error('MongoDB connection error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    process.exit(1);
  }
};

// Health check endpoint with detailed info
app.get('/health', (req, res) => {
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
  const errorResponse = {
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    status: err.status || 500,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  console.error('Error details:', {
    ...errorResponse,
    stack: err.stack,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  res.status(errorResponse.status).json(errorResponse);
});

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});