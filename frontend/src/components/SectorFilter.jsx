import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material';
import { Business, Group, TrendingUp } from '@mui/icons-material';

const SectorFilter = ({ data, onSectorChange, selectedSector }) => {
  const [sectors, setSectors] = useState([]);
  const [sectorStats, setSectorStats] = useState({});

  useEffect(() => {
    if (data && data.length > 0) {
      // Extract unique sectors from designation column
      const uniqueSectors = [...new Set(data.map(item => item.Designation).filter(Boolean))];
      setSectors(uniqueSectors.sort());

      // Calculate statistics for each sector
      const stats = {};
      uniqueSectors.forEach(sector => {
        const sectorData = data.filter(item => item.Designation === sector);
        const totalConsultants = sectorData.length;
        const avgRate = sectorData.reduce((sum, item) => {
          const rate = parseFloat(item['Per day Rate in LKR']?.toString().replace(/[^\d.]/g, '')) || 0;
          return sum + rate;
        }, 0) / totalConsultants;

        stats[sector] = {
          count: totalConsultants,
          avgRate: avgRate,
          totalDuration: sectorData.reduce((sum, item) => {
            const duration = parseFloat(item.Duration?.toString().replace(/[^\d.]/g, '')) || 0;
            return sum + duration;
          }, 0)
        };
      });
      setSectorStats(stats);
    }
  }, [data]);

  const handleSectorChange = (event) => {
    onSectorChange(event.target.value);
  };

  const getSectorColor = (sector) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b',
      '#1565c0', '#2e7d32', '#ef6c00', '#6a1b9a', '#ad1457'
    ];
    const index = sectors.indexOf(sector);
    return colors[index % colors.length];
  };

  return (
    <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50' }}>
          Sector & Designation Analysis
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sector Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="sector-select-label">Select Sector</InputLabel>
            <Select
              labelId="sector-select-label"
              value={selectedSector}
              label="Select Sector"
              onChange={handleSectorChange}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
            >
              <MenuItem value="">All Sectors</MenuItem>
              {sectors.map((sector) => (
                <MenuItem key={sector} value={sector}>
                  {sector}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sector Statistics */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {sectors.slice(0, 6).map((sector) => (
              <Chip
                key={sector}
                label={`${sector} (${sectorStats[sector]?.count || 0})`}
                onClick={() => onSectorChange(sector)}
                sx={{
                  backgroundColor: selectedSector === sector ? getSectorColor(sector) : 'white',
                  color: selectedSector === sector ? 'white' : getSectorColor(sector),
                  border: `2px solid ${getSectorColor(sector)}`,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: getSectorColor(sector),
                    color: 'white',
                  },
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Selected Sector Details */}
      {selectedSector && sectorStats[selectedSector] && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ backgroundColor: '#1976d2', mx: 'auto', mb: 1 }}>
                    <Group />
                  </Avatar>
                  <Typography variant="h6" color="primary">
                    {sectorStats[selectedSector].count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Consultants
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#e8f5e8', border: '1px solid #a5d6a7' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ backgroundColor: '#388e3c', mx: 'auto', mb: 1 }}>
                    <TrendingUp />
                  </Avatar>
                  <Typography variant="h6" color="success.main">
                    LKR {sectorStats[selectedSector].avgRate.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Daily Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc80' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ backgroundColor: '#f57c00', mx: 'auto', mb: 1 }}>
                    <Business />
                  </Avatar>
                  <Typography variant="h6" color="warning.main">
                    {sectorStats[selectedSector].totalDuration.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Duration (Days)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default SectorFilter; 