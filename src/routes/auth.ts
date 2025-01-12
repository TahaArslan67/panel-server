import express, { Response, Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

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

// Debug middleware
router.use((req, res, next) => {
  console.log('Auth Route - Path:', req.path);
  console.log('Auth Route - Method:', req.method);
  console.log('Auth Route - Body:', req.body);
  next();
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login request received:', { body: req.body });
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing credentials:', { username: !!username, password: !!password });
      res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
      return;
    }

    // MongoDB bağlantı durumunu kontrol et
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection is not ready:', mongoose.connection.readyState);
      res.status(503).json({ message: 'Veritabanı bağlantısı kurulamadı' });
      return;
    }

    console.log('Searching for user:', username);
    const user = await User.findOne({ username })
      .select('+password')
      .lean()
      .maxTimeMS(5000)
      .exec()
      .catch((err) => {
        console.error('MongoDB query error:', err);
        return null;
      });

    if (!user) {
      console.log('User not found:', username);
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    console.log('User found, comparing password');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ message: 'Sunucu yapılandırma hatası' });
      return;
    }

    console.log('Password match, generating token');
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful for user:', username);
    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error: any) {
    console.error('Login error details:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      mongoState: mongoose.connection.readyState
    });
    
    if (error.name === 'MongoTimeoutError') {
      res.status(503).json({ 
        message: 'Veritabanı yanıt vermiyor, lütfen daha sonra tekrar deneyin',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      return;
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      res.status(503).json({ 
        message: 'Veritabanı hatası',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(500).json({ 
        message: 'Token oluşturma hatası',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      return;
    }

    res.status(500).json({ 
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Profil bilgilerini getir
router.get('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Profil bilgileri getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil bilgilerini güncelle
router.put('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const { fullName, email, phone, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, email, phone, location },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil resmini güncelle
router.put('/profile/avatar', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const { avatar } = req.body;

    if (!avatar) {
      res.status(400).json({ message: 'Profil resmi gerekli' });
      return;
    }

    // Base64 formatındaki resmi kontrol et
    if (!avatar.startsWith('data:image')) {
      res.status(400).json({ message: 'Geçersiz resim formatı' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    console.log('Profil resmi güncellendi');
    res.json(user);
  } catch (error) {
    console.error('Profil resmi güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre kontrolü
router.post('/check-password', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const { currentPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Mevcut şifre hatalı' });
      return;
    }

    res.json({ message: 'Şifre doğru' });
  } catch (error) {
    console.error('Şifre kontrolü sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre değiştirme
router.post('/change-password', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Mevcut şifre hatalı' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Şifre değiştirme sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;