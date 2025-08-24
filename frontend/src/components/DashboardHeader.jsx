import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import { Business, Dashboard, TrendingUp, Group } from '@mui/icons-material';
import Logo from '../assets/Logo.jpg';

const DashboardHeader = () => {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)'
      }}
    >
      <Toolbar sx={{ minHeight: 80 }}>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <Box
            component="img"
            src={Logo}
            alt="Company Logo"
            sx={{
              height: 60,
              width: 'auto',
              mr: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              IC Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mt: 0.5, fontWeight: 500 }}>
              Individual Contractor Analytics & Management System
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={<Dashboard />}
            label="Dashboard"
            variant="outlined"
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiChip-icon': { color: 'white' },
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardHeader; 