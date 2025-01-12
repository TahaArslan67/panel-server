import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// CORS headers middleware
router.use((req, res, next) => {
  const origin = process.env.NODE_ENV === 'production'
    ? 'https://panel-client-sigma.vercel.app'
    : 'http://localhost:3000';
    
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Bildirimleri getir
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Şimdilik boş bir dizi dönelim
    res.json([]);
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router; 