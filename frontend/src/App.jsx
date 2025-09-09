import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
  Button
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchBar from './components/SearchBar';
import DashboardHeader from './components/DashboardHeader';
import SheetSelector from './components/SheetSelector';
import RateDistributionChart from './components/RateDistributionChart';
import SectorFilter from './components/SectorFilter';
import AccumulativeDuration from './components/AccumulativeDuration';
import DataEntryForm from './components/DataEntryForm';

// Create a modern theme with logo-inspired colors
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Blue
      light: '#64b5f6',
      dark: '#1565c0',
    },
    secondary: {
      main: '#388e3c', // Green
      light: '#81c784',
      dark: '#2e7d32',
    },
    success: {
      main: '#388e3c',
      light: '#81c784',
      dark: '#2e7d32',
    },
    warning: {
      main: '#f57c00', // Orange
      light: '#ffb74d',
      dark: '#ef6c00',
    },
    info: {
      main: '#1976d2',
      light: '#64b5f6',
      dark: '#1565c0',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2027',
      secondary: '#637381',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [contractors, setContractors] = useState([]);
  const [filteredContractors, setFilteredContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Fetch sheet names on mount
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sheets');
        const result = await response.json();
        if (result.success) {
          setSheets(result.sheets);
          setSelectedSheet(result.sheets[0] || '');
        } else {
          throw new Error(result.message || 'Failed to fetch sheet names');
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSheets();
  }, []);

  // Fetch contractors for selected sheet
  useEffect(() => {
    if (!selectedSheet) return;
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/contractors?sheet=${encodeURIComponent(selectedSheet)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setContractors(result.data);
          setFilteredContractors(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContractors();
  }, [selectedSheet]);

  // Filter contractors based on search term and type
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContractors(contractors);
      return;
    }

    const filtered = contractors.filter(contractor => {
      const searchLower = searchTerm.toLowerCase();
      
      switch (searchType) {
        case 'name':
          const firstName = (contractor['First Name'] || '').toLowerCase();
          const lastName = (contractor['Last Name'] || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.toLowerCase();
          return firstName.includes(searchLower) || 
                 lastName.includes(searchLower) || 
                 fullName.includes(searchLower);
        
        case 'designation':
          const designation = (contractor.Designation || '').toLowerCase();
          return designation.includes(searchLower);
        
        case 'all':
        default:
          return Object.values(contractor).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchLower);
          });
      }
    });

    setFilteredContractors(filtered);
  }, [searchTerm, searchType, contractors]);

  // Filter by sector
  useEffect(() => {
    if (!selectedSector) {
      setFilteredContractors(contractors);
      return;
    }

    const sectorFiltered = contractors.filter(contractor => 
      contractor.Designation === selectedSector
    );
    setFilteredContractors(sectorFiltered);
  }, [selectedSector, contractors]);

  const handleDelete = async (sheetName, noValue) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmDelete) return; // Exit if the user cancels the deletion
    console.log(`Attempting to delete entry from sheet: ${sheetName}, No.: ${noValue}`); // Debugging line
    try {
      const response = await fetch(`http://localhost:5000/api/contractors/${sheetName}/${noValue}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        console.log(`Entry with No. ${noValue} deleted from sheet '${sheetName}'`);
        // Refresh data after deletion
        fetchContractors();
      } else {
        console.error('Failed to delete entry:', result.message);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const generateColumns = () => {
    if (contractors.length === 0) return [];

    const firstContractor = contractors[0];
    const columns = [];
    const allColumnNames = Object.keys(firstContractor).filter(key => !key.startsWith('_'));

    // Define priority columns based on the exact Excel structure
    const priorityColumns = [
      'No.',
      'First Name',
      'Last Name',
      'Designation',
      'Duration',
      'Per day Rate in LKR',
      'Per day Rate in USD',
      'Rate in LKR',
      'Rate in USD'
    ];

    // Add priority columns first with specific formatting
    priorityColumns.forEach((colName) => {
      if (firstContractor.hasOwnProperty(colName)) {
        let columnConfig = {
          field: colName,
          headerName: colName,
          flex: 1,
          minWidth: 120,
          sortable: true,
          renderCell: (params) => {
            const value = params.value;
            if (value === null || value === undefined || value === '') {
              return <span style={{ color: '#999', fontStyle: 'italic' }}>-</span>;
            }

            // Special formatting for rate columns
            if (colName.includes('Rate') || colName.includes('LKR') || colName.includes('USD')) {
              const raw = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
              const numValue = isNaN(raw) ? 0 : raw;
              if (colName.includes('LKR')) {
                return `LKR ${numValue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } else if (colName.includes('USD')) {
                return `USD ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } else {
                // Fallback for generic rate columns
                return numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            }

            // Enhanced cell display for multi-line content
            const cellValue = String(value);
            const hasMultipleLines = cellValue.includes('\n') || cellValue.length > 50;

            if (hasMultipleLines) {
              return (
                <Tooltip 
                  title={
                    <div style={{ 
                      maxWidth: '300px', 
                      whiteSpace: 'pre-wrap',
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {cellValue}
                    </div>
                  }
                  placement="top-start"
                  arrow
                >
                  <div style={{ 
                    width: '100%', 
                    maxHeight: '80px', 
                    overflow: 'auto',
                    padding: '4px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: 'help'
                  }}>
                    {cellValue}
                  </div>
                </Tooltip>
              );
            }

            return (
              <Tooltip 
                title={cellValue.length > 30 ? cellValue : ''}
                placement="top-start"
                arrow
                disableHoverListener={cellValue.length <= 30}
              >
                <div style={{ 
                  width: '100%',
                  padding: '4px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word'
                }}>
                  {cellValue}
                </div>
              </Tooltip>
            );
          },
        };

        // Set specific widths for certain columns
        if (colName === 'No.') {
          columnConfig.minWidth = 80;
          columnConfig.flex = 0.5;
        } else if (colName === 'First Name' || colName === 'Last Name') {
          columnConfig.minWidth = 120;
          columnConfig.flex = 1;
        } else if (colName === 'Designation') {
          columnConfig.minWidth = 150;
          columnConfig.flex = 1.5;
        } else if (colName === 'Duration') {
          columnConfig.minWidth = 100;
          columnConfig.flex = 0.8;
        } else if (colName.includes('Rate') || colName.includes('LKR') || colName.includes('USD')) {
          columnConfig.minWidth = 140;
          columnConfig.flex = 1.2;
        }

        columns.push(columnConfig);
      }
    });

    // Add remaining columns that weren't covered by priority columns
    allColumnNames.forEach((colName) => {
      if (!columns.some(col => col.field === colName)) {
        columns.push({
          field: colName,
          headerName: colName,
          flex: 1,
          minWidth: 120,
          sortable: true,
          renderCell: (params) => {
            const value = params.value;
            if (value === null || value === undefined || value === '') {
              return <span style={{ color: '#999', fontStyle: 'italic' }}>-</span>;
            }

            // Enhanced cell display for multi-line content
            const cellValue = String(value);
            const hasMultipleLines = cellValue.includes('\n') || cellValue.length > 50;

            if (hasMultipleLines) {
              return (
                <Tooltip 
                  title={
                    <div style={{ 
                      maxWidth: '300px', 
                      whiteSpace: 'pre-wrap',
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {cellValue}
                    </div>
                  }
                  placement="top-start"
                  arrow
                >
                  <div style={{ 
                    width: '100%', 
                    maxHeight: '80px', 
                    overflow: 'auto',
                    padding: '4px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: 'help'
                  }}>
                    {cellValue}
                  </div>
                </Tooltip>
              );
            }

            return (
              <Tooltip 
                title={cellValue.length > 30 ? cellValue : ''}
                placement="top-start"
                arrow
                disableHoverListener={cellValue.length <= 30}
              >
                <div style={{ 
                  width: '100%',
                  padding: '4px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word'
                }}>
                  {cellValue}
                </div>
              </Tooltip>
            );
          },
        });
      }
    });

    // Add delete column
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        const noValue = params.row['No.'];
        const sheetName = params.row._sheetName;
        return (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleDelete(sheetName, noValue)}
          >
            Delete
          </Button>
        );
      },
    });

    return columns;
  };

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  };

  const handleSearchTypeChange = (newSearchType) => {
    setSearchType(newSearchType);
  };

  const handleSheetChange = (sheet) => {
    setSelectedSheet(sheet);
    setSearchTerm(''); // Reset search on sheet change
    setSelectedSector(''); // Reset sector filter
  };

  const handleSectorChange = (sector) => {
    setSelectedSector(sector);
  };

  const handleDataAdded = (newData) => {
    // Refresh data after adding new entry
    // In a real app, you'd update the local state or refetch
    console.log('New data added:', newData);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <DashboardHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, color: 'text.primary' }}>
            Individual Contractor Dashboard
          </Typography>

          {/* Sheet Selection and Chart */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            <SheetSelector
              sheets={sheets}
              selectedSheet={selectedSheet}
              onSheetChange={handleSheetChange}
            />
            <Box flex={1}>
              <RateDistributionChart data={filteredContractors} />
            </Box>
          </Box>

          {/* Main Dashboard Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
                  fontWeight: 600,
                }
              }}
            >
              <Tab label="Data Table" />
              <Tab label="Sector Analysis" />
              <Tab label="Duration Analysis" />
              <Tab label="Add New Data" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <>
              {/* Search and Data Table */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  onSearchTypeChange={handleSearchTypeChange}
                  searchType={searchType}
                  totalRecords={contractors.length}
                  filteredRecords={filteredContractors.length}
                />
              </Paper>
              
              {/* Sheet Summary Section */}
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
                    📊 Current Sheet: {selectedSheet}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#1565c0' }}>
                      Total Records: <strong>{contractors.length}</strong>
                    </Typography>
                    {searchTerm && (
                      <Typography variant="body2" sx={{ color: '#1565c0' }}>
                        Filtered: <strong>{filteredContractors.length}</strong>
                      </Typography>
                    )}
                    {selectedSector && (
                      <Typography variant="body2" sx={{ color: '#1565c0' }}>
                        Sector: <strong>{selectedSector}</strong>
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ height: '70vh', width: '100%' }}>
                              <DataGrid
                rows={filteredContractors.map((contractor, index) => ({ id: index, ...contractor }))}
                columns={generateColumns()}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50, 100]}
                checkboxSelection={false}
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{
                  '& .MuiDataGrid-cell': { 
                    borderBottom: '1px solid #e0e0e0',
                    fontSize: '14px',
                    padding: '8px 12px',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiDataGrid-columnHeaders': { 
                    backgroundColor: '#f8f9fa', 
                    borderBottom: '2px solid #e0e0e0',
                    '& .MuiDataGrid-columnHeaderTitle': {
                      color: '#000000',
                      fontWeight: 600,
                      fontSize: '14px'
                    }
                  },
                  '& .MuiDataGrid-row:hover': { 
                    backgroundColor: '#f5f5f5' 
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    backgroundColor: '#ffffff'
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: '#f8f9fa'
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '60px'
                  }
                }}
              />
              </Paper>
            </>
          )}

          {activeTab === 1 && (
            <SectorFilter 
              data={contractors}
              onSectorChange={handleSectorChange}
              selectedSector={selectedSector}
            />
          )}

          {activeTab === 2 && (
            <AccumulativeDuration data={contractors} />
          )}

          {activeTab === 3 && (
            <DataEntryForm 
              sheets={sheets}
              onDataAdded={handleDataAdded}
            />
          )}
        </Container>
        
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 