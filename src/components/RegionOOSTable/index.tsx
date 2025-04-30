import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';

interface OOSData {
  id: string;
  sku: string;
  name: string;
  category: string;
  region: string;
  country: string;
  daysOutOfStock: number;
  potentialLoss: number;
}

// Sample data - replace with actual data from your backend
const generateSampleData = (): OOSData[] => {
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'] as const;
  type Region = typeof regions[number];
  
  const countries: Record<Region, string[]> = {
    'North America': ['USA', 'Canada', 'Mexico'],
    'Europe': ['UK', 'Germany', 'France', 'Italy'],
    'Asia Pacific': ['Japan', 'China', 'Australia', 'India'],
    'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia']
  };

  const categories = [
    'Boxing Gloves',
    'MMA Gear',
    'Protective Equipment',
    'Training Equipment',
    'Yoga & Fitness',
    'Fight Wear'
  ];

  const productsByCategory: Record<string, string[]> = {
    'Boxing Gloves': [
      'Pro Boxing Gloves 12oz',
      'Training Boxing Gloves 14oz',
      'Sparring Gloves 16oz',
      'Competition Gloves 10oz',
      'Kids Boxing Gloves 8oz'
    ],
    'MMA Gear': [
      'MMA Fight Gloves',
      'Grappling Gloves',
      'MMA Shin Guards',
      'Competition MMA Shorts',
      'Training MMA Gloves'
    ],
    'Protective Equipment': [
      'Head Guard Pro',
      'Mouth Guard Elite',
      'Groin Guard Pro',
      'Chest Guard Elite',
      'Shin Guards Pro'
    ],
    'Training Equipment': [
      'Heavy Bag Pro',
      'Speed Bag Elite',
      'Double End Bag',
      'Focus Mitts Pro',
      'Thai Pads Elite'
    ],
    'Yoga & Fitness': [
      'Premium Yoga Mat',
      'Resistance Bands Set',
      'Exercise Mat Pro',
      'Foam Roller Elite',
      'Yoga Block Set'
    ],
    'Fight Wear': [
      'Boxing Shorts Pro',
      'Rash Guard Elite',
      'Training Hoodie',
      'Competition Robe',
      'Training Tank Top'
    ]
  };
  
  const data: OOSData[] = [];
  let id = 1;

  regions.forEach((region: Region) => {
    countries[region].forEach((country: string) => {
      // Generate 3-5 random products for each country
      const numProducts = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < numProducts; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const products = productsByCategory[category];
        const productName = products[Math.floor(Math.random() * products.length)];
        
        data.push({
          id: `SKU-${id}`,
          sku: `RDX${id.toString().padStart(6, '0')}`,
          name: productName,
          category,
          region,
          country,
          daysOutOfStock: Math.floor(Math.random() * 30) + 1,
          potentialLoss: Math.floor(Math.random() * 15000) + 500 // Adjusted for realistic price ranges
        });
        id++;
      }
    });
  });

  return data;
};

const downloadAsCSV = (data: OOSData[]) => {
  const headers = ['SKU', 'Name', 'Category', 'Region', 'Country', 'Days Out of Stock', 'Potential Loss'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      `${row.sku},${row.name},${row.category},${row.region},${row.country},${row.daysOutOfStock},$${row.potentialLoss}`
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'oos-data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const RegionOOSTable: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');

  const data = generateSampleData();
  const uniqueRegions = Array.from(new Set(data.map(item => item.region)));
  const uniqueCountries = Array.from(new Set(data.map(item => item.country)));

  const filteredData = data.filter(row => {
    const matchesSearch = 
      row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = filterRegion === 'all' || row.region === filterRegion;
    const matchesCountry = filterCountry === 'all' || row.country === filterCountry;

    return matchesSearch && matchesRegion && matchesCountry;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        height: '100%',
        background: theme.palette.background.paper,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Out of Stock SKUs by Region
        </Typography>
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

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Region</InputLabel>
          <Select
            value={filterRegion}
            label="Region"
            onChange={(e) => {
              setFilterRegion(e.target.value);
              setFilterCountry('all');
              setPage(0);
            }}
          >
            <MenuItem value="all">All Regions</MenuItem>
            {uniqueRegions.map(region => (
              <MenuItem key={region} value={region}>{region}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Country</InputLabel>
          <Select
            value={filterCountry}
            label="Country"
            onChange={(e) => {
              setFilterCountry(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">All Countries</MenuItem>
            {uniqueCountries.map(country => (
              <MenuItem key={country} value={country}>{country}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Region</TableCell>
              <TableCell align="right">Days OOS</TableCell>
              <TableCell align="right">Loss ($)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.region}</TableCell>
                  <TableCell align="right">{row.daysOutOfStock}</TableCell>
                  <TableCell align="right">${row.potentialLoss.toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
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

export default RegionOOSTable; 