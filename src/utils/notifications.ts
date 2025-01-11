import Notification from '../models/Notification';
import User from '../models/User';

export const createNotification = async (
  title: string,
  message: string,
  type: 'user' | 'system' | 'security' | 'maintenance'
) => {
  try {
    // Tüm admin kullanıcılarını bul
    const adminUsers = await User.find({ username: 'admin' });

    // Her admin için bildirim oluştur
    const notifications = adminUsers.map(admin => ({
      userId: admin._id,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Bildirim oluşturulurken hata:', error);
  }
};

export const createUserNotification = async (userEmail: string) => {
  await createNotification(
    'Yeni Kullanıcı Kaydı',
    `Sisteme yeni bir kullanıcı kaydoldu: ${userEmail}`,
    'user'
  );
};

export const createReportNotification = async (increasePercentage: number) => {
  await createNotification(
    'Rapor Sayısı Arttı',
    `Bu ay rapor sayısı %${increasePercentage} artış gösterdi`,
    'system'
  );
};

export const createTaskNotification = async (taskCount: number) => {
  await createNotification(
    'Yeni Görev Eklendi',
    `Sisteme ${taskCount} yeni görev eklendi`,
    'maintenance'
  );
};

export const createSecurityNotification = async (ipAddress: string) => {
  await createNotification(
    'Güvenlik Uyarısı',
    `Şüpheli giriş denemesi tespit edildi: ${ipAddress}`,
    'security'
  );
}; 