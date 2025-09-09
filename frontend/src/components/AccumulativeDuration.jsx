import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Schedule, 
  TrendingUp, 
  Person, 
  Search,
  Sort,
  FilterList
} from '@mui/icons-material';

const AccumulativeDuration = ({ data }) => {
  const [consultants, setConsultants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalDuration');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTotalDurations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cumulative-total-duration');
      const result = await response.json();
      if (result.success) {
        const totalDurations = (result.data || []).map(item => ({
          name: item.name || '',
          totalDuration: Number(item.totalDuration) || 0,
          avgRate: Number(item.avgRate) || 0,
          cumulativeCost: item.cumulativeCost !== undefined && item.cumulativeCost !== null
            ? Number(item.cumulativeCost) || 0
            : (Number(item.totalDuration) || 0) * (Number(item.avgRate) || 0),
          contracts: []
        }));
        setConsultants(totalDurations);
      } else {
        console.error('Failed to fetch total durations:', result.message);
      }
    } catch (error) {
      console.error('Error fetching total durations:', error);
    }
  };

  useEffect(() => {
    fetchTotalDurations();
  }, []);

  if (!consultants || consultants.length === 0) {
    return (
      <Typography variant="h6" color="textSecondary" align="center">
        No data available.
      </Typography>
    );
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortedConsultants = () => {
    const filtered = consultants.filter(consultant => {
      const name = (consultant.name || '').toLowerCase();
      const term = (committedSearch || '').toLowerCase();
      return name.includes(term);
    });

    return filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'totalDuration':
          aVal = a.totalDuration;
          bVal = b.totalDuration;
          break;
        case 'cumulativeCost':
          aVal = a.cumulativeCost;
          bVal = b.cumulativeCost;
          break;
        default:
          aVal = a.totalDuration;
          bVal = b.totalDuration;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const formatDuration = (days) => {
    const value = Number(days);
    if (Number.isNaN(value) || value < 0) return '0 days';
    return `${Math.round(value)} days`;
  };

  const formatCurrency = (amount) => {
    const value = Number(amount);
    if (amount === null || amount === undefined || Number.isNaN(value)) return '0 LKR';
    return value.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).replace('LKR', '').trim() + ' LKR';
  };

  const getTopConsultants = () => {
    return getSortedConsultants().slice(0, 5);
  };

  const sortedConsultants = getSortedConsultants();

  return (
    <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Schedule sx={{ mr: 2, color: 'success.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2e7d32' }}>
          Accumulative Duration Analysis
        </Typography>
      </Box>

      {/* Search and Sort Controls */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search consultants by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setCommittedSearch(searchTerm); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="success" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton color="success" onClick={() => setCommittedSearch(searchTerm)} aria-label="search">
                      <Search />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: 'success.main' },
                  '&.Mui-focused fieldset': { borderColor: 'success.main' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Chip
                icon={<Sort />}
                label={`Sort: ${sortBy === 'totalDuration' ? 'Duration' : 
                       sortBy === 'cumulativeCost' ? 'Cost' : 
                       'Name'}`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<FilterList />}
                label={`${sortedConsultants.length} consultants`}
                color="success"
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Top Consultants Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
          Top Consultants by Total Duration
        </Typography>
        <Grid container spacing={2}>
          {getTopConsultants().map((consultant, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={consultant.name}>
              <Card sx={{ 
                backgroundColor: index === 0 ? '#fff3e0' : 'white',
                border: index === 0 ? '2px solid #ff9800' : '1px solid #e0e0e0',
                height: '100%'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: index === 0 ? '#ff9800' : 'success.main',
                      mx: 'auto', 
                      mb: 1,
                      width: 40,
                      height: 40
                    }}
                  >
                    {index + 1}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {consultant.name.split(' ').slice(0, 2).join(' ')}
                  </Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                    {formatDuration(consultant.totalDuration)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cost: {formatCurrency(consultant.cumulativeCost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Detailed Table */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
          Detailed Consultant Analysis
        </Typography>
        <TableContainer sx={{ maxHeight: 400, backgroundColor: 'white' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    backgroundColor: '#e8f5e8', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#c8e6c9' }
                  }}
                  onClick={() => handleSort('name')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1 }} />
                    Name
                    {sortBy === 'name' && (
                      <Sort sx={{ ml: 1, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: '#e8f5e8', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#c8e6c9' }
                  }}
                  onClick={() => handleSort('totalDuration')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1 }} />
                    Cumulative duration (days)
                    {sortBy === 'totalDuration' && (
                      <Sort sx={{ ml: 1, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: '#e8f5e8', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#c8e6c9' }
                  }}
                  onClick={() => handleSort('cumulativeCost')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Cumulative cost
                    {sortBy === 'cumulativeCost' && (
                      <Sort sx={{ ml: 1, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedConsultants.map((consultant, index) => (
                <TableRow key={consultant.name} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {consultant.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatDuration(consultant.totalDuration)}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(consultant.cumulativeCost)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default AccumulativeDuration; 