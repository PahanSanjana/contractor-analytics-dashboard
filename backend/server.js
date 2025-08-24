const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to the Excel file (relative to backend folder)
const excelFilePath = path.join(__dirname, '..', 'IC (3).xlsm');

// Function to read and merge all sheets from Excel file
function readExcelFile(sheetNameParam = null) {
  try {
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Excel file not found at: ${excelFilePath}`);
    }

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;

    // If a specific sheet is requested, only process that sheet
    const sheetsToProcess = sheetNameParam
      ? sheetNames.filter((name) => name === sheetNameParam)
      : sheetNames;

    let allData = [];

    sheetsToProcess.forEach((sheetName, index) => {
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        // Smart header detection for different sheet structures
        let headerRowIndex = 3; // Default: start from row 4 (index 3)
        let dataStartRowIndex = 4; // Default: start data from row 5 (index 4)
        
        // For 2015_IC sheet, try different header row positions
        if (sheetName === '2015_IC') {
          console.log(`Processing 2015_IC sheet with special logic...`);
          
          // Try to find the header row by looking for key columns
          for (let rowIndex = 0; rowIndex < 10; rowIndex++) { // Check first 10 rows
            const testRow = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              blankrows: false,
              range: rowIndex
            });
            
            if (testRow.length > 0) {
              const testHeaders = testRow[0];
              const hasNoColumn = testHeaders.some(header => 
                header && header.toString().toLowerCase().includes('no')
              );
              const hasFirstNameColumn = testHeaders.some(header => 
                header && header.toString().toLowerCase().includes('first name')
              );
              
              if (hasNoColumn && hasFirstNameColumn) {
                headerRowIndex = rowIndex;
                dataStartRowIndex = rowIndex + 1;
                console.log(`Found headers for 2015_IC at row ${rowIndex + 1}`);
                break;
              }
            }
          }
        }
        
        // Convert sheet to JSON with detected header row
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
          range: headerRowIndex
        });
        
        if (sheetData.length > 0) {
          // Get headers from detected row
          const headers = sheetData[0];
          console.log(`Headers found for ${sheetName}:`, headers);
          
          // Process data rows starting from the row after headers
          for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            const rowData = {};
            
            // Create object with headers as keys
            headers.forEach((header, colIndex) => {
              if (header !== undefined && header !== null && header !== '') {
                rowData[header] = row[colIndex] !== undefined ? row[colIndex] : '';
              }
            });
            
            // Add sheet information
            rowData['_sheetName'] = sheetName;
            rowData['_sheetIndex'] = sheetNames.indexOf(sheetName);
            rowData['_rowIndex'] = i + dataStartRowIndex; // Actual Excel row number
            
            allData.push(rowData);
          }
        }
        
        console.log(`Processed sheet "${sheetName}" with ${sheetData.length - 1} data rows starting from row 5`);
        
      } catch (sheetError) {
        console.error(`Error processing sheet "${sheetName}":`, sheetError);
      }
    });
    
    console.log(`Total records processed: ${allData.length}`);
    return allData;
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// API endpoint to get all contractor data (optionally for a specific sheet)
app.get('/api/contractors', (req, res) => {
  try {
    const { sheet } = req.query;
    const contractors = readExcelFile(sheet);
    res.json({
      success: true,
      count: contractors.length,
      data: contractors,
      sheet: sheet || 'ALL',
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to read contractor data',
    });
  }
});

// API endpoint to get all sheet names
app.get('/api/sheets', (req, res) => {
  try {
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Excel file not found at: ${excelFilePath}`);
    }
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;
    res.json({
      success: true,
      sheets: sheetNames,
      count: sheetNames.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to read sheet names',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Contractor Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Test Excel file access endpoint
app.get('/api/test-excel', (req, res) => {
  try {
    console.log('Testing Excel file access...');
    console.log('Excel file path:', excelFilePath);
    
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Excel file not found',
        path: excelFilePath
      });
    }
    
    // Check file permissions
    try {
      fs.accessSync(excelFilePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (permError) {
      return res.status(500).json({
        success: false,
        message: 'Cannot access Excel file',
        error: permError.message
      });
    }
    
    // Try to read the file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;
    
    // Try to write a test cell to verify write access
    const testSheet = workbook.Sheets[sheetNames[0]];
    const testCell = XLSX.utils.encode_cell({ r: 1000, c: 0 }); // Use a far row to avoid conflicts
    testSheet[testCell] = { v: 'TEST_WRITE_ACCESS' };
    
    try {
      XLSX.writeFile(workbook, excelFilePath);
      // Remove the test cell
      delete testSheet[testCell];
      XLSX.writeFile(workbook, excelFilePath);
      
      res.json({
        success: true,
        message: 'Excel file is accessible and writable',
        path: excelFilePath,
        sheets: sheetNames,
        fileSize: fs.statSync(excelFilePath).size
      });
    } catch (writeError) {
      res.status(500).json({
        success: false,
        message: 'Excel file cannot be written to',
        error: writeError.message,
        path: excelFilePath
      });
    }
    
  } catch (error) {
    console.error('Error testing Excel file:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test Excel file access'
    });
  }
});

// Debug endpoint to inspect sheet structure
app.get('/api/debug-sheet/:sheetName', (req, res) => {
  try {
    const { sheetName } = req.params;
    console.log(`Debugging sheet: ${sheetName}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    if (!workbook.Sheets[sheetName]) {
      return res.status(404).json({
        success: false,
        message: `Sheet '${sheetName}' not found`
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Get first 15 rows to inspect structure
    const inspectionData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      range: 0 // Start from row 1
    });
    
    const first15Rows = inspectionData.slice(0, 15);
    
    res.json({
      success: true,
      sheetName: sheetName,
      totalRows: inspectionData.length,
      first15Rows: first15Rows,
      columnCount: first15Rows.length > 0 ? first15Rows[0].length : 0
    });
    
  } catch (error) {
    console.error('Error debugging sheet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to debug sheet'
    });
  }
});

// Test endpoint to add a simple test row
app.post('/api/test-add-row', (req, res) => {
  try {
    console.log('=== TESTING ROW ADDITION ===');
    
    // Read the existing Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheet = workbook.Sheets['2015_IC']; // Use the sheet you're working with
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet 2015_IC not found'
      });
    }
    
    // Get current data
    const currentData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', range: 3 });
    const nextRowIndex = currentData.length + 3;
    
    console.log('Current rows:', currentData.length);
    console.log('Next row index:', nextRowIndex);
    
    // Add a simple test row
    const testRow = ['TEST_ROW', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA', 'TEST_DATA'];
    
    // Add row using sheet_add_aoa
    XLSX.utils.sheet_add_aoa(sheet, [testRow], { origin: nextRowIndex });
    
    // Write to file
    XLSX.writeFile(workbook, excelFilePath);
    console.log('Test row written to file');
    
    // Verify by reading back
    const verificationWorkbook = XLSX.readFile(excelFilePath);
    const verificationSheet = verificationWorkbook.Sheets['2015_IC'];
    const verificationData = XLSX.utils.sheet_to_json(verificationSheet, { header: 1, defval: '', range: 3 });
    
    console.log('After write - Total rows:', verificationData.length);
    console.log('Test row data:', verificationData[nextRowIndex - 3]);
    
    res.json({
      success: true,
      message: 'Test row added and verified',
      rowAdded: nextRowIndex + 1,
      totalRows: verificationData.length,
      testRowData: verificationData[nextRowIndex - 3]
    });
    
  } catch (error) {
    console.error('Test row addition failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to add test row'
    });
  }
});

// API endpoint to add new contractor data
app.post('/api/contractors', (req, res) => {
  try {
    const newData = req.body;
    const { sheet } = newData;
    
    console.log('Received data for sheet:', sheet);
    console.log('New data:', newData);
    
    if (!sheet) {
      return res.status(400).json({
        success: false,
        message: 'Sheet name is required'
      });
    }

    // Check if Excel file exists and is accessible
    if (!fs.existsSync(excelFilePath)) {
      console.error('Excel file not found at:', excelFilePath);
      return res.status(404).json({
        success: false,
        message: 'Excel file not found'
      });
    }

    // Check file permissions
    try {
      fs.accessSync(excelFilePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (permError) {
      console.error('File permission error:', permError.message);
      return res.status(500).json({
        success: false,
        message: 'Cannot access Excel file. Please ensure it is not open in another application.'
      });
    }

    // Read the existing Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(excelFilePath);
    
    if (!workbook.Sheets[sheet]) {
      console.error('Sheet not found:', sheet);
      console.log('Available sheets:', workbook.SheetNames);
      return res.status(404).json({
        success: false,
        message: `Sheet '${sheet}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`
      });
    }

    const worksheet = workbook.Sheets[sheet];
    console.log('Worksheet found, processing data...');
    
    // Get the current data to find the next row
    const currentData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', range: 3 });
    const nextRowIndex = currentData.length + 3; // Start from row 4 (index 3)
    
    console.log('Current data rows:', currentData.length);
    console.log('Next row index:', nextRowIndex);
    
    // Prepare the new row data
    const newRow = [
      newData['No.'] || '',
      newData['First Name'] || '',
      newData['Last Name'] || '',
      newData['Designation'] || '',
      newData['Qualifications'] || '',
      newData['Contact Details'] || '',
      newData['Years of Experience'] || '',
      newData['Duration (Months/Days)'] || '',
      newData['Per day Rate in LKR'] || '',
      newData['Per day Rate in USD'] || '',
      newData['Rate in LKR'] || '',
      newData['Rate in USD'] || ''
    ];
    
    console.log('New row data:', newRow);
    
    // Add the new row to the worksheet using a different approach
    console.log('Adding row data to worksheet...');
    
    // Method 1: Try using XLSX.utils.sheet_add_aoa
    try {
      XLSX.utils.sheet_add_aoa(worksheet, [newRow], { origin: nextRowIndex });
      console.log('Row added using sheet_add_aoa method');
    } catch (aoaError) {
      console.log('sheet_add_aoa failed, trying manual cell addition:', aoaError.message);
      
      // Method 2: Manual cell addition
      newRow.forEach((value, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: nextRowIndex, c: colIndex });
        worksheet[cellAddress] = { v: value, t: 's' }; // Explicitly set type to string
        console.log(`Added cell ${cellAddress}: ${value}`);
      });
    }
    
    // Create backup before writing
    const backupPath = excelFilePath.replace('.xlsm', `_backup_${Date.now()}.xlsm`);
    try {
      fs.copyFileSync(excelFilePath, backupPath);
      console.log('Backup created at:', backupPath);
    } catch (backupError) {
      console.warn('Could not create backup:', backupError.message);
    }
    
    // Write the updated workbook back to the file
    console.log('Writing to Excel file...');
    try {
      XLSX.writeFile(workbook, excelFilePath);
      console.log('Excel file written successfully');
      
      // Verify the data was actually written by reading it back
      console.log('Verifying data was written...');
      try {
        const verificationWorkbook = XLSX.readFile(excelFilePath);
        const verificationSheet = verificationWorkbook.Sheets[sheet];
        const verificationData = XLSX.utils.sheet_to_json(verificationSheet, { header: 1, defval: '', range: 3 });
        
        console.log('Verification - Total rows after write:', verificationData.length);
        console.log('Verification - Row at index', nextRowIndex - 3, ':', verificationData[nextRowIndex - 3]);
        
        // Check if our new row is there
        if (verificationData[nextRowIndex - 3]) {
          const writtenRow = verificationData[nextRowIndex - 3];
          console.log('Verification - Written row data:', writtenRow);
          
          // Compare with what we intended to write
          const matches = newRow.every((value, index) => 
            String(writtenRow[index] || '') === String(value)
          );
          
          if (matches) {
            console.log('✅ VERIFICATION SUCCESS: Data matches what was written');
          } else {
            console.log('❌ VERIFICATION FAILED: Data does not match');
            console.log('Expected:', newRow);
            console.log('Actual:', writtenRow);
          }
        } else {
          console.log('❌ VERIFICATION FAILED: Row not found at expected position');
        }
        
      } catch (verificationError) {
        console.error('Verification failed:', verificationError.message);
      }
      
      // Remove backup if write was successful
      try {
        fs.unlinkSync(backupPath);
        console.log('Backup removed');
      } catch (cleanupError) {
        console.warn('Could not remove backup:', cleanupError.message);
      }
      
    } catch (writeError) {
      console.error('Error writing to Excel file:', writeError);
      
      // Try to restore from backup
      try {
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, excelFilePath);
          console.log('Restored from backup due to write error');
        }
      } catch (restoreError) {
        console.error('Could not restore from backup:', restoreError.message);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to write to Excel file. Please ensure it is not open in another application.',
        error: writeError.message
      });
    }
    
    console.log(`New data added to sheet '${sheet}' at row ${nextRowIndex + 1}`);
    
    res.json({
      success: true,
      message: 'Data added successfully',
      sheet: sheet,
      row: nextRowIndex + 1
    });
    
  } catch (error) {
    console.error('Error adding contractor data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to add contractor data',
      details: error.stack
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Contractor Dashboard Backend running on port ${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/contractors`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
}); 