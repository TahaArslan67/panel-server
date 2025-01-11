import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Badge,
  useTheme,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  Delete as DeleteIcon,
  NotificationsOff as NotificationsOffIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 280;

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'user' | 'system' | 'security' | 'maintenance';
  isRead: boolean;
  createdAt: string;
}

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  role: 'yönetici' | 'üye';
}

// Global bildirim state'i için context oluştur
const NotificationContext = React.createContext<{
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}>({
  notifications: [],
  setNotifications: () => {}
});

// API URL'i için sabit değişken
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Dashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
    navigate('/', { replace: true });
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      component: <DashboardContent />
    },
    { 
      text: 'Profil', 
      icon: <PersonIcon />, 
      path: '/profile',
      component: <ProfileContent />
    },
    { 
      text: 'Bildirimler', 
      icon: <NotificationIcon />, 
      path: '/notifications',
      component: <NotificationsContent />
    },
    { 
      text: 'Ayarlar', 
      icon: <SettingsIcon />, 
      path: '/settings',
      component: <SettingsContent />
    }
  ];

  const getCurrentComponent = () => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => item.path === currentPath);
    return menuItem?.component || <DashboardContent />;
  };

  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: theme.palette.background.default }}>
      <Toolbar sx={{ 
        backgroundColor: theme.palette.primary.main, 
        color: 'white',
        minHeight: '80px !important'
      }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 2 }} />
        <ListItemButton 
          onClick={handleLogout}
          sx={{
            mx: 1,
            borderRadius: 1,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: theme.palette.error.light,
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              }
            }
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main, minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </ListItemButton>
      </List>
    </Box>
  );

  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Bildirimleri yükle
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Bildirimler yüklenirken hata:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Bildirim işleme fonksiyonları
  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  const [profileData, setProfileData] = React.useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    avatar: '',
    role: 'üye'
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      <Box sx={{ display: 'flex', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: 'white',
            color: 'black',
            boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(8px)',
            background: 'rgba(255, 255, 255, 0.95)',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Toolbar sx={{ minHeight: '80px !important', display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 2, 
                  display: { sm: 'none' },
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, display: { xs: 'none', sm: 'block' } }}>
                Admin Panel
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <IconButton 
                  onClick={(event) => setNotificationAnchor(event.currentTarget)}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: '12px',
                    padding: '10px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.06)'
                    }
                  }}
                >
                  <Badge 
                    badgeContent={notifications.filter(n => !n.isRead).length} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#FF4842',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: notifications.filter(n => !n.isRead).length > 0 ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.2)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }
                    }}
                  >
                    <NotificationIcon />
                  </Badge>
                </IconButton>
              </Box>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  padding: '5px 15px 5px 5px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.06)'
                  }
                }}
                onClick={() => navigate('/profile')}
              >
                <Avatar 
                  sx={{ 
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                  src={profileData.avatar || ''}
                >
                  {!profileData.avatar && (profileData.fullName?.charAt(0) || 'A')}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {profileData.fullName || 'Admin User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profileData.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: theme.palette.background.default
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: theme.palette.background.default,
                borderRight: '1px solid rgba(0,0,0,0.12)'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: '80px'
          }}
        >
          {getCurrentComponent()}
        </Box>
      </Box>
    </NotificationContext.Provider>
  );
};

// Dashboard Ana Sayfa İçeriği
const DashboardContent = () => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6} lg={3}>
      <Card sx={{ height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PeopleIcon />
            </Avatar>
            <Typography variant="h6">Kullanıcılar</Typography>
          </Box>
          <Typography variant="h4">150</Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam Kullanıcı Sayısı
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={6} lg={3}>
      <Card sx={{ height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
              <AssessmentIcon />
            </Avatar>
            <Typography variant="h6">Raporlar</Typography>
          </Box>
          <Typography variant="h4">28</Typography>
          <Typography variant="body2" color="text.secondary">
            Aylık Rapor Sayısı
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={6} lg={3}>
      <Card sx={{ height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
              <AssignmentIcon />
            </Avatar>
            <Typography variant="h6">Görevler</Typography>
          </Box>
          <Typography variant="h4">12</Typography>
          <Typography variant="body2" color="text.secondary">
            Aktif Görev Sayısı
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12}>
      <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h5" gutterBottom>
          Son Aktiviteler
        </Typography>
        <Divider sx={{ my: 2 }} />
        {/* Aktivite listesi buraya eklenebilir */}
      </Paper>
    </Grid>
  </Grid>
);

// Profil Sayfası İçeriği
const ProfileContent = () => {
  const [profileData, setProfileData] = React.useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    avatar: '',
    role: 'üye'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState({ text: '', type: 'success' });
  const [imagePreview, setImagePreview] = React.useState('');
  const [openImageDialog, setOpenImageDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profil bilgilerini yükle
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata:', error);
        setMessage({ text: 'Profil bilgileri yüklenemedi!', type: 'error' });
      }
    };

    fetchProfile();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setOpenImageDialog(true);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    setIsLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/profile/avatar`, 
        { avatar: imagePreview },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setProfileData({ ...profileData, avatar: imagePreview });
      setMessage({ text: 'Profil resmi güncellendi!', type: 'success' });
      setOpenImageDialog(false);
    } catch (error) {
      console.error('Profil resmi güncellenirken hata:', error);
      setMessage({ text: 'Profil resmi güncellenirken bir hata oluştu!', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/auth/profile`,
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setProfileData(response.data);
      setMessage({ text: 'Profil başarıyla güncellendi!', type: 'success' });
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      setMessage({ text: 'Profil güncellenirken bir hata oluştu!', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                margin: '0 auto',
                bgcolor: 'primary.main',
                fontSize: '3rem',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              src={profileData.avatar || ''}
              onClick={handleImageClick}
            >
              {!profileData.avatar && profileData.fullName?.charAt(0)}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'white'
                }
              }}
              onClick={handleImageClick}
            >
              <PhotoCameraIcon />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </Box>
          <Typography variant="h5" sx={{ mt: 2 }}>{profileData.fullName}</Typography>
          <Typography color="textSecondary">
            {profileData.role}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {profileData.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Telefon:</strong> {profileData.phone}
            </Typography>
            <Typography variant="body1">
              <strong>Konum:</strong> {profileData.location}
            </Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" gutterBottom>Profil Detayları</Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={profileData.fullName}
                onChange={handleProfileChange('fullName')}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={profileData.email}
                onChange={handleProfileChange('email')}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={profileData.phone}
                onChange={handleProfileChange('phone')}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Konum"
                value={profileData.location}
                onChange={handleProfileChange('location')}
                variant="outlined"
              />
            </Grid>
          </Grid>
          {message.text && (
            <Alert 
              severity={message.type as 'success' | 'error'} 
              sx={{ mt: 2 }}
            >
              {message.text}
            </Alert>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Değişiklikleri Kaydet'}
            </Button>
          </Box>
        </Paper>
      </Grid>

      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)}>
        <DialogTitle>Profil Resmi Önizleme</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Avatar
              src={imagePreview}
              sx={{ width: 200, height: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>İptal</Button>
          <Button onClick={handleImageUpload} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

// Ayarlar Sayfası İçeriği
const SettingsContent = () => {
  const [passwords, setPasswords] = React.useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState({ text: '', type: 'success' });

  const handlePasswordChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleUpdatePassword = async () => {
    // Şifre validasyonu
    if (passwords.new !== passwords.confirm) {
      setMessage({ text: 'Yeni şifreler eşleşmiyor!', type: 'error' });
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ text: 'Yeni şifre en az 6 karakter olmalıdır!', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // Mevcut şifreyi kontrol et
      const checkCurrentPassword = await axios.post(`${API_URL}/api/auth/check-password`, {
        password: passwords.current
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!checkCurrentPassword.data.isValid) {
        setMessage({ text: 'Mevcut şifre yanlış!', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Şifre değiştirme isteği
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage({ text: 'Şifre başarıyla güncellendi!', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' }); // Şifre alanlarını temizle
    } catch (error: any) {
      if (error.response?.status === 401) {
        setMessage({ text: 'Mevcut şifre yanlış!', type: 'error' });
      } else {
        setMessage({ text: 'Şifre güncellenirken bir hata oluştu!', type: 'error' });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" gutterBottom>Bildirim Ayarları</Typography>
          <Divider sx={{ mb: 3 }} />
          <FormGroup>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Bildirimleri"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Push Bildirimleri"
            />
            <FormControlLabel
              control={<Switch />}
              label="SMS Bildirimleri"
            />
          </FormGroup>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" gutterBottom>Güvenlik Ayarları</Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mevcut Şifre"
                type="password"
                variant="outlined"
                value={passwords.current}
                onChange={handlePasswordChange('current')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yeni Şifre"
                type="password"
                variant="outlined"
                value={passwords.new}
                onChange={handlePasswordChange('new')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yeni Şifre (Tekrar)"
                type="password"
                variant="outlined"
                value={passwords.confirm}
                onChange={handlePasswordChange('confirm')}
              />
            </Grid>
          </Grid>
          {message.text && (
            <Alert 
              severity={message.type as 'success' | 'error'} 
              sx={{ mt: 2 }}
            >
              {message.text}
            </Alert>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleUpdatePassword}
              disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Şifreyi Güncelle'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Bildirimler Sayfası İçeriği
const NotificationsContent = () => {
  const { notifications, setNotifications } = React.useContext(NotificationContext);
  const [selectedTab, setSelectedTab] = React.useState('unread');

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`${API_URL}/api/notifications/mark-all-read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenirken hata:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Bildirimler</Typography>
            {unreadNotifications.length > 0 && (
              <Button
                variant="outlined"
                onClick={handleMarkAllAsRead}
                startIcon={<DoneAllIcon />}
              >
                Tümünü Okundu İşaretle
              </Button>
            )}
          </Box>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Okunmamış
                  {unreadNotifications.length > 0 && (
                    <Badge
                      badgeContent={unreadNotifications.length}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              value="unread"
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Okunmuş
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({readNotifications.length})
                  </Typography>
                </Box>
              }
              value="read"
            />
          </Tabs>
          <List>
            {(selectedTab === 'unread' ? unreadNotifications : readNotifications)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notification, index, array) => (
                <React.Fragment key={notification._id}>
                  <ListItemButton 
                    sx={{ 
                      py: 2,
                      px: 3,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: selectedTab === 'unread' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => selectedTab === 'unread' && handleMarkAsRead(notification._id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: selectedTab === 'unread' ? 'bold' : 'normal' }}>
                            {notification.title}
                          </Typography>
                          {selectedTab === 'unread' && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                ml: 1
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {selectedTab === 'unread' && (
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { color: 'success.main' }
                          }}
                        >
                          <DoneIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                  {index < array.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            {((selectedTab === 'unread' && unreadNotifications.length === 0) ||
              (selectedTab === 'read' && readNotifications.length === 0)) && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {selectedTab === 'unread' ? 'Okunmamış bildiriminiz bulunmuyor' : 'Okunmuş bildiriminiz bulunmuyor'}
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Yardımcı fonksiyonlar
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'user':
      return '#2196F3';
    case 'system':
      return '#FF9800';
    case 'security':
      return '#F44336';
    case 'maintenance':
      return '#4CAF50';
    default:
      return '#757575';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'user':
      return <PersonIcon />;
    case 'system':
      return <SettingsIcon />;
    case 'security':
      return <SecurityIcon />;
    case 'maintenance':
      return <BuildIcon />;
    default:
      return <NotificationIcon />;
  }
};

const formatNotificationTime = (date: string) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Şimdi';
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} saat önce`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} gün önce`;
  
  return notificationDate.toLocaleDateString('tr-TR');
};

export default Dashboard;