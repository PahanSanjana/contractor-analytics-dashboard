import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, PieChart, Pie, Label } from 'recharts';
import { 
  Paper, 
  Typography, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { TrendingUp, Person, Business, Schedule } from '@mui/icons-material';

// Helper to group rates into buckets
function groupRates(data, rateKey = 'Per day Rate in LKR', bucketSize = 5000) {
  const buckets = {};
  const bucketDetails = {};
  
  data.forEach((row) => {
    const rate = parseFloat(row[rateKey]?.toString().replace(/[^\d.]/g, ''));
    if (!isNaN(rate)) {
      const bucket = Math.floor(rate / bucketSize) * bucketSize;
      const label = `${bucket.toLocaleString()} - ${(bucket + bucketSize - 1).toLocaleString()}`;
      
      if (!buckets[label]) {
        buckets[label] = 0;
        bucketDetails[label] = [];
      }
      
      buckets[label]++;
      bucketDetails[label].push(row);
    }
  });
  
  // Convert to array and sort by bucket value
  return Object.entries(buckets)
    .map(([label, count]) => ({ 
      label, 
      count, 
      details: bucketDetails[label],
      bucketStart: parseInt(label.split(' ')[0].replace(/,/g, ''))
    }))
    .sort((a, b) => a.bucketStart - b.bucketStart);
}

const COLORS = ['#1976d2', '#64b5f6', '#90caf9', '#b3e5fc', '#e3f2fd', '#ffb300', '#ff7043', '#d32f2f'];

const RateDistributionChart = ({ data, rateKey = 'Per day Rate in LKR', chartType = 'bar' }) => {
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const chartData = groupRates(data, rateKey);
  
  if (!chartData.length) {
    return (
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
        <Typography variant="h6" sx={{ textAlign: 'center', color: '#1565c0' }}>
          No rate data available for chart.
        </Typography>
      </Paper>
    );
  }

  // Highlight the lowest cost bucket
  const minCount = Math.min(...chartData.map((d) => d.count));
  const minBuckets = chartData.filter((d) => d.count === minCount).map((d) => d.label);

  const handleBarClick = (data) => {
    if (data && data.details) {
      setSelectedBucket(data);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBucket(null);
  };

  const formatRate = (rate) => {
    const numValue = parseFloat(rate?.toString().replace(/[^\d.-]/g, ''));
    if (!isNaN(numValue)) {
      return `LKR ${numValue.toLocaleString()}`;
    }
    return rate || '-';
  };

  const formatDuration = (duration) => {
    const numValue = parseFloat(duration?.toString().replace(/[^\d.-]/g, ''));
    if (!isNaN(numValue)) {
      if (numValue < 30) return `${numValue} days`;
      if (numValue < 365) return `${(numValue / 30).toFixed(1)} months`;
      return `${(numValue / 365).toFixed(1)} years`;
    }
    return duration || '-';
  };

  return (
    <>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUp sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1565c0' }}>
            Contractor Distribution by Per Day Rate in LKR
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2, color: '#1976d2', fontStyle: 'italic' }}>
          💡 Click on any bar to view detailed consultant information for that rate range
        </Typography>

        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={minBuckets.includes(entry.label) ? '#43a047' : COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, 'Contractors']}
                  labelFormatter={(label) => `${label} LKR`}
                />
                <Legend />
              </PieChart>
            ) : (
              <BarChart 
                data={chartData} 
                margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const clickedData = data.activePayload[0].payload;
                    handleBarClick(clickedData);
                  }
                }}
              >
                <XAxis 
                  dataKey="label" 
                  angle={-30} 
                  textAnchor="end" 
                  interval={0} 
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Number of Contractors', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [value, 'Contractors']}
                  labelFormatter={(label) => `${label} LKR`}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Contractors"
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => handleBarClick(data)}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={minBuckets.includes(entry.label) ? '#43a047' : COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Chart Summary */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip 
              icon={<TrendingUp />} 
              label={`${chartData.length} Rate Ranges`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<Person />} 
              label={`${data.length} Total Contractors`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
            Most Competitive: {minBuckets.join(', ')} LKR
          </Typography>
        </Box>
      </Paper>

      {/* Consultant Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business sx={{ mr: 1 }} />
            Consultants in Rate Range: {selectedBucket?.label} LKR
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedBucket && (
            <>
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  icon={<Person />} 
                  label={`${selectedBucket.count} Consultants`} 
                  color="primary" 
                  size="large"
                />
                <Chip 
                  icon={<Schedule />} 
                  label={`Rate Range: ${selectedBucket.label} LKR`} 
                  color="secondary" 
                  size="large"
                />
              </Box>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: '#e3f2fd', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1 }} />
                          Consultant Name
                        </Box>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#e3f2fd', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ mr: 1 }} />
                          Designation
                        </Box>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#e3f2fd', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Schedule sx={{ mr: 1 }} />
                          Duration
                        </Box>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#e3f2fd', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUp sx={{ mr: 1 }} />
                          Daily Rate (LKR)
                        </Box>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#e3f2fd', fontWeight: 600 }}>
                        Sheet
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBucket.details.map((consultant, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {consultant['First Name']} {consultant['Last Name']}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={consultant.Designation || 'N/A'} 
                            color="primary" 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={formatDuration(consultant.Duration)} 
                            color="success" 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {formatRate(consultant['Per day Rate in LKR'])}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={consultant._sheetName || 'N/A'} 
                            color="secondary" 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RateDistributionChart; 