import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

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