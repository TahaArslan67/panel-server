import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

const router = express.Router();

// Bildirimleri getir
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Gelen user id:', req.user?.id);
    
    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    // Tüm bildirimleri kontrol et
    const allNotifications = await Notification.find({});
    console.log('Tüm bildirimler:', allNotifications);

    // Kullanıcıya ait bildirimleri bul
    const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(req.user.id) })
      .sort({ createdAt: -1 });
    
    console.log('Kullanıcının bildirimleri:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirimi okundu olarak işaretle
router.post('/:id/read', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Okundu işaretlenecek bildirim id:', req.params.id);
    console.log('Kullanıcı id:', req.user?.id);

    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const notificationId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: 'Geçersiz bildirim ID' });
      return;
    }

    // Güncelleme öncesi bildirimi kontrol et
    const existingNotification = await Notification.findById(notificationId);
    console.log('Mevcut bildirim:', existingNotification);

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(req.user.id)
      },
      { $set: { isRead: true } },
      { new: true }
    );

    console.log('Güncellenmiş bildirim:', notification);

    if (!notification) {
      res.status(404).json({ message: 'Bildirim bulunamadı' });
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.post('/mark-all-read', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Tüm bildirimleri okundu işaretleme - Kullanıcı id:', req.user?.id);

    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    // Güncelleme öncesi bildirimleri kontrol et
    const existingNotifications = await Notification.find({ 
      userId: new mongoose.Types.ObjectId(req.user.id),
      isRead: false 
    });
    console.log('Okunmamış bildirimler:', existingNotifications);

    const result = await Notification.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(req.user.id),
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    console.log('Güncelleme sonucu:', result);
    res.json({ 
      message: 'Tüm bildirimler okundu olarak işaretlendi',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Bildirimler güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirimi sil
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Silinecek bildirim id:', req.params.id);
    console.log('Kullanıcı id:', req.user?.id);

    if (!req.user?.id) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const notificationId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: 'Geçersiz bildirim ID' });
      return;
    }

    // Silme öncesi bildirimi kontrol et
    const existingNotification = await Notification.findById(notificationId);
    console.log('Silinecek bildirim:', existingNotification);

    const notification = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!notification) {
      res.status(404).json({ message: 'Bildirim bulunamadı' });
      return;
    }

    console.log('Silinen bildirim:', notification);
    res.json({ message: 'Bildirim silindi', deletedNotification: notification });
  } catch (error) {
    console.error('Bildirim silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router; 