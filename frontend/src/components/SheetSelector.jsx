import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const SheetSelector = ({ sheets, selectedSheet, onSheetChange }) => {
  return (
    <Box sx={{ minWidth: 220, mb: 2 }}>
      <FormControl fullWidth variant="outlined" size="medium">
        <InputLabel id="sheet-select-label">Sheet (Year)</InputLabel>
        <Select
          labelId="sheet-select-label"
          value={selectedSheet}
          label="Sheet (Year)"
          onChange={(e) => onSheetChange(e.target.value)}
        >
          {sheets.map((sheet) => (
            <MenuItem key={sheet} value={sheet}>
              {sheet}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SheetSelector; 