import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { 
  Add, 
  Save, 
  Clear, 
  CalendarToday,
  Person,
  Business,
  Schedule,
  AttachMoney
} from '@mui/icons-material';

const DataEntryForm = ({ sheets, onDataAdded }) => {
  const [formData, setFormData] = useState({
    'No.': '',
    'First Name': '',
    'Last Name': '',
    'Designation': '',
    'Qualifications': '',
    'Contact Details': '',
    'Years of Experience': '',
    'Duration (Months/Days)': '',
    'Per day Rate in LKR': '',
    'Per day Rate in USD': '',
    'Rate in LKR': '',
    'Rate in USD': ''
  });
  
  const [selectedSheet, setSelectedSheet] = useState('');

  const [designations, setDesignations] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (sheets.length > 0) {
      setSelectedSheet(sheets[0]);
    }
  }, [sheets]);

  // Common designations for auto-complete
  useEffect(() => {
    const commonDesignations = [
      'Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Project Manager',
      'Business Analyst', 'Data Analyst', 'Data Scientist', 'DevOps Engineer',
      'QA Engineer', 'UI/UX Designer', 'Product Manager', 'Scrum Master',
      'System Administrator', 'Network Engineer', 'Security Engineer', 'Cloud Engineer',
      'Mobile Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'
    ];
    setDesignations(commonDesignations);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData['First Name']?.trim()) {
      newErrors['First Name'] = 'First Name is required';
    }
    
    if (!formData['Last Name']?.trim()) {
      newErrors['Last Name'] = 'Last Name is required';
    }
    
    if (!formData['Designation']?.trim()) {
      newErrors['Designation'] = 'Designation is required';
    }
    
    if (!formData['Duration (Months/Days)']?.trim()) {
      newErrors['Duration (Months/Days)'] = 'Duration is required';
    }
    
    if (!formData['Per day Rate in LKR']?.trim()) {
      newErrors['Per day Rate in LKR'] = 'Daily Rate in LKR is required';
    } else if (isNaN(parseFloat(formData['Per day Rate in LKR']))) {
      newErrors['Per day Rate in LKR'] = 'Daily Rate must be a number';
    }
    
    if (!selectedSheet) {
      newErrors.sheet = 'Please select a sheet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const calculateRates = () => {
    const durationStr = formData['Duration (Months/Days)'] || '';
    let duration = 0;
    
    // Parse duration from various formats
    if (durationStr) {
      const durationLower = durationStr.toLowerCase();
      if (durationLower.includes('month') || durationLower.includes('months')) {
        const months = parseFloat(durationStr.replace(/[^\d.]/g, ''));
        duration = months * 30; // Convert months to days
      } else if (durationLower.includes('day') || durationLower.includes('days')) {
        duration = parseFloat(durationStr.replace(/[^\d.]/g, ''));
      } else {
        duration = parseFloat(durationStr.replace(/[^\d.]/g, ''));
      }
    }
    
    const dailyRateLKR = parseFloat(formData['Per day Rate in LKR']) || 0;
    const dailyRateUSD = parseFloat(formData['Per day Rate in USD']) || 0;
    
    if (duration > 0 && dailyRateLKR > 0) {
      const totalRateLKR = duration * dailyRateLKR;
      setFormData(prev => ({
        ...prev,
        'Rate in LKR': totalRateLKR.toFixed(2)
      }));
    }
    
    if (duration > 0 && dailyRateUSD > 0) {
      const totalRateUSD = duration * dailyRateUSD;
      setFormData(prev => ({
        ...prev,
        'Rate in USD': totalRateUSD.toFixed(2)
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Calculate rates before submission
      calculateRates();
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        sheet: selectedSheet
      };

      // Send data to backend
      const response = await fetch('http://localhost:5000/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        setSuccessMessage(`Data added successfully to ${result.sheet} at row ${result.row}!`);
        
        // Reset form
        handleClear();
        
        // Notify parent component
        if (onDataAdded) {
          onDataAdded(submissionData);
        }
      } else {
        setErrorMessage(result.message || 'Failed to add data');
        console.error('Backend error:', result);
      }
      
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Failed to add data. Please try again.');
    }
  };

  const handleClear = () => {
    setFormData({
      'No.': '',
      'First Name': '',
      'Last Name': '',
      'Designation': '',
      'Qualifications': '',
      'Contact Details': '',
      'Years of Experience': '',
      'Duration (Months/Days)': '',
      'Per day Rate in LKR': '',
      'Per day Rate in USD': '',
      'Rate in LKR': '',
      'Rate in USD': ''
    });
    setErrors({});
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Add sx={{ mr: 2, color: 'warning.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#e65100' }}>
          Add New Data Entry
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sheet and Year Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.sheet}>
            <InputLabel id="sheet-select-label">Select Sheet</InputLabel>
            <Select
              labelId="sheet-select-label"
              value={selectedSheet}
              label="Select Sheet"
              onChange={(e) => setSelectedSheet(e.target.value)}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: 'warning.main' },
                  '&.Mui-focused fieldset': { borderColor: 'warning.main' },
                },
              }}
            >
              {sheets.map((sheet) => (
                <MenuItem key={sheet} value={sheet}>
                  {sheet}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>



        {/* Personal Information */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#fff8e1', border: '1px solid #ffcc80' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main">
                  Personal Information
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData['First Name']}
                    onChange={(e) => handleInputChange('First Name', e.target.value)}
                    error={!!errors['First Name']}
                    helperText={errors['First Name']}
                    sx={{ backgroundColor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData['Last Name']}
                    onChange={(e) => handleInputChange('Last Name', e.target.value)}
                    error={!!errors['Last Name']}
                    helperText={errors['Last Name']}
                    sx={{ backgroundColor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Designation"
                    value={formData['Designation']}
                    onChange={(e) => handleInputChange('Designation', e.target.value)}
                    error={!!errors['Designation']}
                    helperText={errors['Designation']}
                    sx={{ backgroundColor: 'white' }}
                    InputProps={{
                      list: 'designations-list'
                    }}
                  />
                  <datalist id="designations-list">
                    {designations.map((designation) => (
                      <option key={designation} value={designation} />
                    ))}
                  </datalist>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Qualifications"
                    value={formData['Qualifications']}
                    onChange={(e) => handleInputChange('Qualifications', e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Details"
                    value={formData['Contact Details']}
                    onChange={(e) => handleInputChange('Contact Details', e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                    multiline
                    rows={2}
                    placeholder="Phone, Email, Address..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Years of Experience"
                    value={formData['Years of Experience']}
                    onChange={(e) => handleInputChange('Years of Experience', e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                    placeholder="e.g., 5 years"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Contract Details */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#fff8e1', border: '1px solid #ffcc80' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main">
                  Contract Details
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Duration (Months/Days)"
                    value={formData['Duration (Months/Days)']}
                    onChange={(e) => handleInputChange('Duration (Months/Days)', e.target.value)}
                    error={!!errors['Duration (Months/Days)']}
                    helperText={errors['Duration (Months/Days)']}
                    sx={{ backgroundColor: 'white' }}
                    onBlur={calculateRates}
                    placeholder="e.g., 6 months or 180 days"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Per Day Rate (LKR)"
                    value={formData['Per day Rate in LKR']}
                    onChange={(e) => handleInputChange('Per day Rate in LKR', e.target.value)}
                    error={!!errors['Per day Rate in LKR']}
                    helperText={errors['Per day Rate in LKR']}
                    sx={{ backgroundColor: 'white' }}
                    onBlur={calculateRates}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Per Day Rate (USD)"
                    value={formData['Per day Rate in USD']}
                    onChange={(e) => handleInputChange('Per day Rate in USD', e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                    onBlur={calculateRates}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Total Rate (LKR)"
                    value={formData['Rate in LKR']}
                    InputProps={{ readOnly: true }}
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Rate (USD)"
                    value={formData['Rate in USD']}
                    InputProps={{ readOnly: true }}
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="No."
                    value={formData['No.']}
                    onChange={(e) => handleInputChange('No.', e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                    placeholder="Entry number"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClear}
              sx={{ 
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': { borderColor: 'warning.dark' }
              }}
            >
              Clear Form
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              sx={{ 
                backgroundColor: 'warning.main',
                '&:hover': { backgroundColor: 'warning.dark' }
              }}
            >
              Add Entry
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Success/Error Messages */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DataEntryForm; 