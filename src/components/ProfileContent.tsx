import React from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import axios from 'axios';

const ProfileContent = () => {
  const [profileData, setProfileData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    avatar: ''
  });

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const [imagePreview, setImagePreview] = React.useState('');
  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProfileData(response.data);
        if (response.data.avatar) {
          setImagePreview(response.data.avatar);
        }
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await axios.put('http://localhost:5001/api/auth/profile', profileData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess(true);
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await axios.put('http://localhost:5001/api/auth/profile/avatar', 
        { avatar: imagePreview },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setProfileData({ ...profileData, avatar: imagePreview });
      setSuccess(true);
      setOpenImageDialog(false);
    } catch (error) {
      console.error('Profil resmi güncellenirken hata:', error);
      setError('Profil resmi güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profileData.avatar || ''}
                sx={{
                  width: 100,
                  height: 100,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
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
            <Box sx={{ ml: 3 }}>
              <Typography variant="h5" gutterBottom>
                Profil Ayarları
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profil bilgilerinizi buradan güncelleyebilirsiniz
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ad Soyad"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="E-posta"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Konum"
                  name="location"
                  value={profileData.location}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Kaydet'}
                  </Button>
                  {success && (
                    <Alert severity="success" sx={{ flex: 1 }}>
                      Profil başarıyla güncellendi
                    </Alert>
                  )}
                  {error && (
                    <Alert severity="error" sx={{ flex: 1 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </form>
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
          <Button onClick={handleImageUpload} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ProfileContent; 