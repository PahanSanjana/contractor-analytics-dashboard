import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { Search, FilterList, Person, Business, Clear } from '@mui/icons-material';

const SearchBar = ({ searchTerm, onSearchChange, totalRecords, filteredRecords, onSearchTypeChange, searchType = 'all' }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localSearchType, setLocalSearchType] = useState(searchType);

  const handleSearchChange = (value) => {
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  const handleSearchTypeChange = (newType) => {
    if (newType !== null) {
      setLocalSearchType(newType);
      if (onSearchTypeChange) {
        onSearchTypeChange(newType);
      }
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  const getSearchPlaceholder = () => {
    switch (localSearchType) {
      case 'name':
        return 'Search by first or last name...';
      case 'designation':
        return 'Search by designation...';
      case 'all':
      default:
        return 'Search across all columns...';
    }
  };

  const getSearchIcon = () => {
    switch (localSearchType) {
      case 'name':
        return <Person color="primary" />;
      case 'designation':
        return <Business color="primary" />;
      default:
        return <Search color="primary" />;
    }
  };

  return (
    <Box>
      <Grid container spacing={3} alignItems="center">
        {/* Search Type Selector */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="search-type-label">Search Type</InputLabel>
            <Select
              labelId="search-type-label"
              value={localSearchType}
              label="Search Type"
              onChange={(e) => handleSearchTypeChange(e.target.value)}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Search sx={{ mr: 1, fontSize: 18 }} />
                  All Columns
                </Box>
              </MenuItem>
              <MenuItem value="name">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, fontSize: 18 }} />
                  Name Only
                </Box>
              </MenuItem>
              <MenuItem value="designation">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1, fontSize: 18 }} />
                  Designation
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Search Input */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={getSearchPlaceholder()}
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getSearchIcon()}
                </InputAdornment>
              ),
              endAdornment: localSearchTerm && (
                <InputAdornment position="end">
                  <Clear 
                    onClick={handleClearSearch}
                    sx={{ cursor: 'pointer', color: 'text.secondary' }}
                  />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
          />
        </Grid>
        
        {/* Records Counter */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <FilterList sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Records
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {filteredRecords}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  of {totalRecords} total
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Search Results and Type Indicator */}
      {localSearchTerm && (
        <Box mt={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredRecords} results for "{localSearchTerm}"
            </Typography>
            <Chip
              label={localSearchType === 'name' ? 'Name Search' : 
                     localSearchType === 'designation' ? 'Designation Search' : 'All Columns'}
              color="primary"
              variant="outlined"
              size="small"
              icon={getSearchIcon()}
            />
          </Box>
          
          {/* Search Type Specific Info */}
          {localSearchType === 'name' && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Searching in First Name and Last Name columns only
            </Typography>
          )}
          {localSearchType === 'designation' && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Searching in Designation column only
            </Typography>
          )}
        </Box>
      )}

      {/* Quick Search Tips */}
      {!localSearchTerm && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            💡 Use the search type selector to focus your search on specific columns
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar; 