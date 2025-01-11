import express, { Response, Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// CORS headers middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://panel-client-sigma.vercel.app');
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
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    const user = await User.findOne({ username }).select('+password').lean().exec();
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('Login successful, token generated');
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
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