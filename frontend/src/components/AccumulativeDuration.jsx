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
  const [sortBy, setSortBy] = useState('totalDuration');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (data && data.length > 0) {
      // Debug: Log the first few items to see the actual data structure
      console.log('Sample data items:', data.slice(0, 3));
      console.log('Available columns:', Object.keys(data[0]));
      
      // Group consultants by name and calculate accumulative duration
      const consultantMap = new Map();
      
      data.forEach(item => {
        const firstName = item['First Name'] || '';
        const lastName = item['Last Name'] || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const designation = item.Designation || '';
        // Parse duration from various possible duration column names
        let duration = 0;
        const possibleDurationKeys = [
          'Duration (Months/Days)',
          'Duration',
          'Duration (Days)',
          'Duration (Months)',
          'Contract Duration',
          'Project Duration'
        ];
        
        let durationValue = '';
        for (const key of possibleDurationKeys) {
          if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
            durationValue = item[key];
            break;
          }
        }
        
        // Debug: Log duration parsing for first few items
        if (data.indexOf(item) < 3) {
          console.log('Processing item:', {
            firstName: item['First Name'],
            lastName: item['Last Name'],
            durationValue: durationValue,
            originalDuration: item['Duration (Months/Days)'],
            fallbackDuration: item.Duration
          });
        }
        
        if (durationValue) {
          const durationStr = durationValue.toString().toLowerCase();
          
          // Handle different duration formats
          if (durationStr.includes('month') || durationStr.includes('months')) {
            // Extract number of months and convert to days
            const months = parseFloat(durationStr.replace(/[^\d.]/g, ''));
            duration = months * 30; // Approximate conversion
            if (data.indexOf(item) < 3) console.log('Parsed as months:', months, '→', duration, 'days');
          } else if (durationStr.includes('day') || durationStr.includes('days')) {
            // Extract number of days
            duration = parseFloat(durationStr.replace(/[^\d.]/g, ''));
            if (data.indexOf(item) < 3) console.log('Parsed as days:', duration);
          } else {
            // Try to parse as direct number (assume days)
            duration = parseFloat(durationStr.replace(/[^\d.]/g, ''));
            if (data.indexOf(item) < 3) console.log('Parsed as direct number:', duration);
          }
        }
        
        if (data.indexOf(item) < 3) {
          console.log('Final duration value:', duration);
        }
        const rate = parseFloat(item['Per day Rate in LKR']?.toString().replace(/[^\d.]/g, '')) || 0;
        const sheet = item._sheetName || '';
        
        if (fullName && fullName !== '') {
          if (consultantMap.has(fullName)) {
            const existing = consultantMap.get(fullName);
            existing.totalDuration += duration;
            existing.contracts.push({
              sheet,
              duration,
              rate,
              designation
            });
            existing.avgRate = (existing.avgRate + rate) / 2;
          } else {
            consultantMap.set(fullName, {
              name: fullName,
              firstName,
              lastName,
              totalDuration: duration,
              avgRate: rate,
              contracts: [{
                sheet,
                duration,
                rate,
                designation
              }],
              currentDesignation: designation
            });
          }
        }
      });
      
      const consultantsList = Array.from(consultantMap.values());
      console.log('Final consultants data:', consultantsList.slice(0, 3));
      console.log('Total consultants found:', consultantsList.length);
      setConsultants(consultantsList);
    }
  }, [data]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortedConsultants = () => {
    const filtered = consultants.filter(consultant =>
      consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultant.currentDesignation.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        case 'avgRate':
          aVal = a.avgRate;
          bVal = b.avgRate;
          break;
        case 'contracts':
          aVal = a.contracts.length;
          bVal = b.contracts.length;
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
    if (!days || days === 0) return '0 days';
    if (days < 30) return `${Math.round(days)} days`;
    if (days < 365) return `${(days / 30).toFixed(1)} months`;
    return `${(days / 365).toFixed(1)} years`;
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
              placeholder="Search consultants by name or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="success" />
                  </InputAdornment>
                ),
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
                       sortBy === 'avgRate' ? 'Rate' : 
                       sortBy === 'name' ? 'Name' : 'Contracts'}`}
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
                    {consultant.contracts.length} contracts
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
                    Consultant Name
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
                    Total Duration
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
                  onClick={() => handleSort('avgRate')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Avg. Rate (LKR)
                    {sortBy === 'avgRate' && (
                      <Sort sx={{ ml: 1, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#e8f5e8', fontWeight: 600 }}>
                  Current Designation
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: '#e8f5e8', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#c8e6c9' }
                  }}
                  onClick={() => handleSort('contracts')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterList sx={{ mr: 1 }} />
                    Contracts
                    {sortBy === 'contracts' && (
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      LKR {consultant.avgRate.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {consultant.currentDesignation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${consultant.contracts.length} contracts`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
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