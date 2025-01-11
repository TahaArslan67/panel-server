import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import mongoose from 'mongoose';
import User from './models/User';
import bcrypt from 'bcrypt';
import notificationRoutes from './routes/notifications';
import Notification from './models/Notification';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// CORS ayarları
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 - Not Found:', req.method, req.path);
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB bağlantısı
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://arslantaha67:0022800228t@panel.gjn1k.mongodb.net/panel?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Admin kullanıcısını kontrol et ve rolünü güncelle
    let adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      // Admin kullanıcısının rolünü güncelle
      await User.findOneAndUpdate(
        { username: 'admin' },
        { role: 'yönetici' },
        { new: true }
      );
      console.log('Admin kullanıcısının rolü güncellendi');
    } else {
      console.log('Admin kullanıcısı bulunamadı, yeni admin oluşturuluyor...');
      const password = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        password: password,
        fullName: 'Admin User',
        email: 'admin@example.com',
        phone: '+90 555 555 5555',
        location: 'İstanbul, Türkiye',
        role: 'yönetici'
      });
      console.log('Yeni admin kullanıcısı oluşturuldu');
    }
    
    // Örnek bildirimleri kontrol et
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      // Örnek bildirimleri oluştur
      const notifications = [
        {
          userId: adminUser._id,
          title: 'Yeni Kullanıcı Kaydı',
          message: 'Sisteme yeni bir kullanıcı kaydoldu: mehmet@example.com',
          type: 'user',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          userId: adminUser._id,
          title: 'Rapor Sayısı Arttı',
          message: 'Bu ay rapor sayısı %15 artış gösterdi',
          type: 'system',
          isRead: false,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          userId: adminUser._id,
          title: 'Güvenlik Uyarısı',
          message: 'Şüpheli giriş denemesi tespit edildi: 192.168.1.1',
          type: 'security',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          userId: adminUser._id,
          title: 'Yeni Görev Eklendi',
          message: 'Sisteme 3 yeni görev eklendi',
          type: 'maintenance',
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ];

      await Notification.insertMany(notifications);
      console.log('Örnek bildirimler oluşturuldu');
    }
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log('Available routes:');
      console.log('POST /api/auth/login');
      console.log('POST /api/auth/check-password');
      console.log('POST /api/auth/change-password');
      console.log('GET /api/auth/profile');
      console.log('PUT /api/auth/profile');
      console.log('GET /api/notifications');
      console.log('POST /api/notifications/:id/read');
      console.log('POST /api/notifications/mark-all-read');
      console.log('DELETE /api/notifications/:id');
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));