import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      window.dispatchEvent(new Event('storage'));
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      
      console.log('Login successful:', response.data);
    } catch (error) {
      console.error('Login error:', error);
      setError('Geçersiz kullanıcı adı veya şifre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        padding: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <Avatar
            sx={{
              margin: 1,
              backgroundColor: 'primary.main',
              width: 56,
              height: 56
            }}
          >
            <LockOutlined />
          </Avatar>
          
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              marginBottom: 3
            }}
          >
            Giriş Yap
          </Typography>

          <form 
            onSubmit={handleLogin}
            style={{ width: '100%' }}
          >
            <TextField
              label="Kullanıcı Adı"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              label="Şifre"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            
            {error && (
              <Typography 
                color="error" 
                sx={{ 
                  mt: 2, 
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,0,0,0.1)',
                  padding: 1,
                  borderRadius: 1
                }}
              >
                {error}
              </Typography>
            )}

            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                },
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <CircularProgress 
                  size={24} 
                  sx={{ 
                    color: 'primary.light',
                    position: 'absolute'
                  }}
                />
              ) : 'Giriş Yap'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 