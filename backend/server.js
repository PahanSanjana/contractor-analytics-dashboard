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
const excelFilePath = path.join(__dirname, '..', 'IC 2015-2025.xlsx');
// Path to the cumulative Excel file (absolute path provided by user)
const cumulativeExcelFilePath = path.join(__dirname, '..', 'IC Duration Cumulative.xlsx');

// Function to read and merge all sheets from Excel file
function readExcelFile(sheetNameParam) {
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

    sheetsToProcess.forEach((sheetName) => {
      try {
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON with specified headers
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: [
            'No.',
            'First Name',
            'Last Name',
            'Designation',
            'Qualifications',
            'Contact Details',
            'Years of Experience',
            'Duration (Days)',
            'Per day Rate in LKR',
            'Per day Rate in USD',
            'Rate in LKR',
            'Rate in USD'
          ],
          defval: '',
          blankrows: false,
          range: 0 // Start from the first row
        });

        if (sheetData.length > 0) {
          // Process data rows
          sheetData.forEach((row, index) => {
            const rowData = { ...row };
            rowData['_sheetName'] = sheetName;
            rowData['_sheetIndex'] = sheetNames.indexOf(sheetName);
            rowData['_rowIndex'] = index + 1; // Actual Excel row number
            allData.push(rowData);
          });
        }

        console.log(`Processed sheet "${sheetName}" with ${sheetData.length} data rows starting from row 1`);

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

// Function to read cumulative Excel file and return aggregated rows with Name (B), Cumulative duration (C), Cumulative cost (D)
function readCumulativeExcelFile() {
  try {
    if (!fs.existsSync(cumulativeExcelFilePath)) {
      throw new Error(`Cumulative Excel file not found at: ${cumulativeExcelFilePath}`);
    }

    const parseNumberSafe = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return isFinite(value) ? value : 0;
      const str = String(value).replace(/[,\s]/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const workbook = XLSX.readFile(cumulativeExcelFilePath);
    const sheetNames = workbook.SheetNames;
    const aggregateByName = new Map();

    sheetNames.forEach((sheetName) => {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!rows || rows.length === 0) return;

        // Try to detect header row by looking for a cell containing 'name'
        let headerIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i].map((c) => String(c).toLowerCase());
          if (row.some((c) => c.includes('name'))) {
            headerIndex = i;
            break;
          }
        }

        for (let r = headerIndex + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const name = String(row[1] || '').trim(); // Column B
          const durationDays = parseNumberSafe(row[2]); // Column C
          const cumulativeCost = parseNumberSafe(row[3]); // Column D
          if (!name) continue;

          const prev = aggregateByName.get(name) || { name, totalDuration: 0, cumulativeCost: 0 };
          prev.totalDuration += durationDays;
          prev.cumulativeCost += cumulativeCost;
          aggregateByName.set(name, prev);
        }
      } catch (sheetError) {
        console.error(`Error processing cumulative sheet "${sheetName}":`, sheetError);
      }
    });

    return Array.from(aggregateByName.values());
  } catch (error) {
    console.error('Error reading cumulative Excel file:', error);
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

// API endpoint to get total duration aggregated by person from the cumulative Excel file
app.get('/api/cumulative-total-duration', (req, res) => {
  try {
    const data = readCumulativeExcelFile().map(item => ({
      name: item.name,
      totalDuration: Number(item.totalDuration) || 0,
      cumulativeCost: Number(item.cumulativeCost) || 0,
      avgRate: (Number(item.totalDuration) ? (Number(item.cumulativeCost) || 0) / Number(item.totalDuration) : 0)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error calculating cumulative total duration:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate cumulative total duration', error: error.message });
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

      // Verify by reading back
      const verificationWorkbook = XLSX.readFile(excelFilePath);
      const verificationSheet = verificationWorkbook.Sheets[sheet];
      const verificationData = XLSX.utils.sheet_to_json(verificationSheet, { header: 1, defval: '', range: 3 });

      console.log('Verification - Total rows after write:', verificationData.length);
      console.log('Verification - Last row data:', verificationData[verificationData.length - 1]);

      res.json({
        success: true,
        message: `Data added successfully to sheet '${sheet}' at row ${nextRowIndex + 1}`,
        sheet: sheet,
        row: nextRowIndex + 1
      });
    } catch (writeError) {
      console.error('Error writing to Excel file:', writeError);

      // Attempt to restore from backup
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

// API endpoint to get total duration across all sheets
app.get('/api/total-duration', (req, res) => {
  try {
    const contractors = readExcelFile(); // Read all sheets
    const durationMap = new Map();

    contractors.forEach(contractor => {
      const name = `${contractor['First Name']} ${contractor['Last Name']}`;
      const durationDays = parseInt(contractor['Duration (Days)'], 10) || 0;

      console.log(`Row data for ${name}:`, contractor); // Detailed debugging line
      console.log(`Processing ${name}: ${durationDays} days`); // Debugging line

      if (durationMap.has(name)) {
        durationMap.set(name, durationMap.get(name) + durationDays);
      } else {
        durationMap.set(name, durationDays);
      }
    });

    const totalDurations = Array.from(durationMap.entries()).map(([name, totalDays]) => ({ name, totalDays }));

    res.json({
      success: true,
      totalDurations
    });
  } catch (error) {
    console.error('Error calculating total duration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to calculate total duration'
    });
  }
});

// API endpoint to delete a contractor entry
app.delete('/api/contractors/:sheetName/:rowIndex', (req, res) => {
  try {
    const { sheetName, rowIndex } = req.params;
    const noValue = parseInt(rowIndex, 10); // Use rowIndex as the 'No.' value
    console.log(`Deleting entry from sheet: ${sheetName}, No.: ${noValue}`);

    const workbook = XLSX.readFile(excelFilePath);
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: `Sheet '${sheetName}' not found`
      });
    }

    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', range: 0 });
    const headerRow = sheetData[0];

    // Assume 'No.' is the first column (A)
    const noIndex = 0;

    console.log(`Checking 'No.' values in sheet: ${sheetName}`);
    console.log('Sheet data:', sheetData);

    const rowToDelete = sheetData.findIndex((row, index) => {
      const currentNo = parseInt(row[noIndex], 10); // Ensure numeric comparison
      console.log(`Row ${index + 1}: No. = ${currentNo} (type: ${typeof currentNo})`);
      return index > 0 && currentNo === noValue;
    });

    if (rowToDelete === -1) {
      console.error(`No matching 'No.' value found for: ${noValue}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid No. value'
      });
    }

    // Shift all rows after the deleted row up by one
    for (let R = rowToDelete; R < sheetData.length - 1; ++R) {
      for (let C = 0; C < sheetData[R].length; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const nextCellAddress = XLSX.utils.encode_cell({ r: R + 1, c: C });
        worksheet[cellAddress] = worksheet[nextCellAddress];
      }
    }

    // Update the range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    range.e.r--;
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    XLSX.writeFile(workbook, excelFilePath);

    res.json({
      success: true,
      message: `Entry with No. ${noValue} deleted from sheet '${sheetName}'`
    });
  } catch (error) {
    console.error('Error deleting contractor entry:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete contractor entry'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Contractor Dashboard Backend running on port ${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/contractors`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});