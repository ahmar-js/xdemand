import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  useTheme,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface ForecastOOSData {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  forecastedDemand: number;
  daysUntilOOS: number;
  recommendedOrder: number;
}

const generateSampleData = (): ForecastOOSData[] => {
  const categories = [
    'Boxing Gloves',
    'MMA Gear',
    'Protective Equipment',
    'Training Equipment',
    'Yoga & Fitness',
    'Fight Wear'
  ];

  const products = [
    'Pro Boxing Gloves',
    'Training Boxing Gloves',
    'MMA Fight Gloves',
    'Grappling Gloves',
    'Head Guard Pro',
    'Heavy Bag Pro',
    'Premium Yoga Mat',
    'Boxing Shorts Pro',
    'Training Hoodie',
    'Competition Robe'
  ];

  return Array.from({ length: 50 }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const currentStock = Math.floor(Math.random() * 50);
    const forecastedDemand = currentStock + Math.floor(Math.random() * 100) + 20;
    const daysUntilOOS = Math.floor((currentStock / (forecastedDemand / 30)));
    
    return {
      id: `FSKU-${index + 1}`,
      sku: `RDX${(index + 1).toString().padStart(6, '0')}`,
      name: `${product} ${Math.floor(Math.random() * 3) + 1}`,
      category,
      currentStock,
      forecastedDemand,
      daysUntilOOS,
      recommendedOrder: Math.max(0, forecastedDemand - currentStock)
    };
  });
};

const ForecastOOSTable: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const data = generateSampleData();

  const filteredData = data.filter(row =>
    row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadAsCSV = (data: ForecastOOSData[]) => {
    const headers = ['SKU', 'Name', 'Category', 'Current Stock', 'Forecasted Demand', 'Days Until OOS', 'Recommended Order'];
    const csvData = data.map(row => [
      row.sku,
      row.name,
      row.category,
      row.currentStock,
      row.forecastedDemand,
      row.daysUntilOOS,
      row.recommendedOrder
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'forecast_oos_skus.csv';
    link.click();
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        background: theme.palette.background.paper,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Forecast OOS
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 150 }}
          />
          <IconButton
            onClick={() => downloadAsCSV(filteredData)}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.light + '20',
              },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Box>
      </Box>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '20%', color: 'black', fontWeight: 600 }}>SKU</TableCell>
              <TableCell sx={{ width: '35%', color: 'black', fontWeight: 600 }}>Name</TableCell>
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Qty</TableCell>
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Days</TableCell>
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Order</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow 
                  key={row.id}
                  sx={{
                    backgroundColor: 'white',
                    '& > td': {
                      color: 'black'
                    }
                  }}
                >
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.sku}</TableCell>
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</TableCell>
                  <TableCell align="right">{row.currentStock}</TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      color: row.daysUntilOOS <= 7 
                        ? theme.palette.error.main
                        : row.daysUntilOOS <= 14
                          ? theme.palette.warning.main
                          : 'black'
                    }}
                  >
                    {row.daysUntilOOS}
                  </TableCell>
                  <TableCell align="right">{row.recommendedOrder}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default ForecastOOSTable; 