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

interface TopRevenueOOSData {
  id: string;
  sku: string;
  name: string;
  category: string;
  revenue: number;
  daysOutOfStock: number;
  potentialRevenueLoss: number;
  lastStockDate: string;
}

const generateSampleData = (): TopRevenueOOSData[] => {
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

  const data = Array.from({ length: 50 }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const revenue = Math.floor(Math.random() * 100000) + 5000;
    const daysOutOfStock = Math.floor(Math.random() * 30) + 1;
    
    // Calculate a date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: `RSKU-${index + 1}`,
      sku: `RDX${(index + 1).toString().padStart(6, '0')}`,
      name: `${product} ${Math.floor(Math.random() * 3) + 1}`,
      category,
      revenue,
      daysOutOfStock,
      potentialRevenueLoss: Math.floor(revenue * (daysOutOfStock / 30)),
      lastStockDate: date.toISOString().split('T')[0]
    };
  });

  // Sort by revenue in ascending order
  return data.sort((a, b) => a.revenue - b.revenue);
};

const TopRevenueOOSTable: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const allData = generateSampleData().slice(0, 50); // Always get top 50

  const filteredData = allData.filter(row =>
    row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadAsCSV = (data: TopRevenueOOSData[]) => {
    const headers = ['SKU', 'Name', 'Category', 'Revenue', 'Days Out of Stock', 'Potential Revenue Loss', 'Last Stock Date'];
    const csvData = data.map(row => [
      row.sku,
      row.name,
      row.category,
      row.revenue,
      row.daysOutOfStock,
      row.potentialRevenueLoss,
      row.lastStockDate
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'top_revenue_oos_skus.csv';
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
          Top OOS by Revenue
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
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Rev</TableCell>
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Days</TableCell>
              <TableCell align="right" sx={{ width: '15%', color: 'black', fontWeight: 600 }}>Loss</TableCell>
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
                  <TableCell align="right">{(row.revenue/1000).toFixed(1)}k</TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      color: row.daysOutOfStock >= 14 
                        ? theme.palette.error.main
                        : row.daysOutOfStock >= 7
                          ? theme.palette.warning.main
                          : 'black'
                    }}
                  >
                    {row.daysOutOfStock}
                  </TableCell>
                  <TableCell align="right">{(row.potentialRevenueLoss/1000).toFixed(1)}k</TableCell>
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

export default TopRevenueOOSTable; 