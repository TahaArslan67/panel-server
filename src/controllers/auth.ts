import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    const user = await User.findOne({ username });
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValid);

    if (!isValid) {
      console.log('Invalid password');
      res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('Login successful, token generated');
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const checkPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;
    console.log('checkPassword - userId:', userId);
    console.log('checkPassword - password:', password);

    if (!userId) {
      console.log('checkPassword - No userId provided');
      res.status(401).json({ message: 'Yetkilendirme başarısız' });
      return;
    }

    const user = await User.findById(userId);
    console.log('checkPassword - Found user:', user);

    if (!user) {
      console.log('checkPassword - User not found');
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('checkPassword - Password comparison result:', isValid);
    
    res.json({ isValid });
  } catch (error) {
    console.error('Şifre kontrolü hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    console.log('changePassword - userId:', userId);
    console.log('changePassword - currentPassword:', currentPassword);
    console.log('changePassword - newPassword:', newPassword);

    if (!userId) {
      console.log('changePassword - No userId provided');
      res.status(401).json({ message: 'Yetkilendirme başarısız' });
      return;
    }

    const user = await User.findById(userId);
    console.log('changePassword - Found user:', user);

    if (!user) {
      console.log('changePassword - User not found');
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    // Mevcut şifreyi kontrol et
    const isValid = await bcrypt.compare(currentPassword, user.password);
    console.log('changePassword - Current password valid:', isValid);

    if (!isValid) {
      console.log('changePassword - Invalid current password');
      res.status(401).json({ message: 'Mevcut şifre yanlış' });
      return;
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('changePassword - New password hashed');
    
    // Şifreyi güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { password: hashedPassword },
      { new: true }
    );
    console.log('changePassword - Updated user:', updatedUser);
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme başarısız' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { fullName, email, phone, location } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme başarısız' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, email, phone, location },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};