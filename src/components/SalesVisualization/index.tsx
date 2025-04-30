import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { 
  Box, 
  FormControl, 
  IconButton, 
  InputLabel, 
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem, 
  Paper,
  Select, 
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  Typography, 
  useTheme, 
} from '@mui/material';
import { FormattedMessage } from 'react-intl';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';

interface SalesData {
  name: string;
  value: number;
  percentage: number;
}

// Sample data - replace with actual data from your backend
const generateSampleData = (type: 'category' | 'company'): SalesData[] => {
  if (type === 'category') {
    return [
      { name: 'Electronics', value: 45000, percentage: 30 },
      { name: 'Clothing', value: 35000, percentage: 23.33 },
      { name: 'Food & Beverage', value: 30000, percentage: 20 },
      { name: 'Home & Garden', value: 25000, percentage: 16.67 },
      { name: 'Sports', value: 15000, percentage: 10 },
    ];
  } else {
    return [
      { name: 'Company A', value: 50000, percentage: 33.33 },
      { name: 'Company B', value: 40000, percentage: 26.67 },
      { name: 'Company C', value: 30000, percentage: 20 },
      { name: 'Company D', value: 20000, percentage: 13.33 },
      { name: 'Company E', value: 10000, percentage: 6.67 },
    ];
  }
};

const downloadAsCSV = (data: SalesData[], filename: string) => {
  const headers = ['Name', 'Sales Value', 'Percentage'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => `${row.name},${row.value},${row.percentage}%`)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadAsImage = async (chartRef: React.RefObject<HTMLDivElement>) => {
  if (!chartRef.current) return;
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgElement = chartRef.current.querySelector('svg');
    
    if (!svgElement || !ctx) return;
    
    const rect = svgElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const data = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'sales-visualization.png';
        link.href = downloadUrl;
        link.click();
        
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    
    img.src = url;
  } catch (error) {
    console.error('Error generating image:', error);
  }
};

const SalesVisualization: React.FC = () => {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  const [groupBy, setGroupBy] = useState<'category' | 'company'>('category');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const data = useMemo(() => generateSampleData(groupBy), [groupBy]);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'bar' | 'pie',
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadOption = (format: 'csv' | 'image') => {
    if (format === 'csv') {
      downloadAsCSV(data, `sales-by-${groupBy}.csv`);
    } else if (format === 'image') {
      downloadAsImage(chartRef);
    }
    handleClose();
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
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          <FormattedMessage 
            id="sales-visualization-title" 
            defaultMessage="Sales Data Visualization" 
          />
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="bar">
              <MuiTooltip title="Bar Chart">
                <BarChartIcon />
              </MuiTooltip>
            </ToggleButton>
            <ToggleButton value="pie">
              <MuiTooltip title="Pie Chart">
                <PieChartIcon />
              </MuiTooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Box>
            <MuiTooltip title="Download Options">
              <IconButton
                size="small"
                onClick={handleClick}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '20',
                  },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </MuiTooltip>
          </Box>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={groupBy}
              label="Group By"
              onChange={(e) => setGroupBy(e.target.value as 'category' | 'company')}
            >
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="company">Company</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Box 
        ref={chartRef}
        sx={{ 
          flex: 1,
          minHeight: 350,
          position: 'relative',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 60,
                bottom: 70,
              }}
              height={400}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{ dy: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={theme.palette.primary.main}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  style={{ fill: theme.palette.text.primary }}
                  dy={-10}
                />
              </Bar>
            </BarChart>
          ) : (
            <PieChart height={400}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill={theme.palette.primary.main}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  name
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius * 1.2;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={theme.palette.text.primary}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      style={{ fontSize: '12px' }}
                    >
                      {`${name}: $${value.toLocaleString()}`}
                    </text>
                  );
                }}
              >
                {data.map((entry, index) => {
                  const colors = [
                    theme.palette.primary.light,
                    theme.palette.primary.main,
                    theme.palette.primary.dark
                  ];
                  return (
                    <Cell
                      key={entry.name}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 1,
            '& .MuiMenuItem-root': {
              py: 1.5,
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleDownloadOption('csv')}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Download as CSV" 
            secondary="Raw data in spreadsheet format"
            primaryTypographyProps={{
              fontWeight: 500,
            }}
          />
        </MenuItem>
        <MenuItem onClick={() => handleDownloadOption('image')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Download as Image" 
            secondary="High-quality PNG format"
            primaryTypographyProps={{
              fontWeight: 500,
            }}
          />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default SalesVisualization; 