import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://arslantaha67:0022800228t@panel.gjn1k.mongodb.net/panel';

async function testConnection() {
  try {
    console.log('MongoDB bağlantısı test ediliyor...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('MongoDB bağlantısı başarılı!');
    console.log('Bağlantı durumu:', mongoose.connection.readyState);
    
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      console.log('Mevcut koleksiyonlar:', collections.map(c => c.collectionName));
    }
    
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection(); 