import React, { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { 
  Box, 
  Button,
  FormControl, 
  IconButton, 
  InputLabel, 
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem, 
  Select, 
  Tooltip as MuiTooltip,
  Typography, 
  useTheme, 
} from '@mui/material';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';

interface DataPoint {
  date: string;
  loss: number;
}

interface ZoomDomain {
  x: [string, string] | null;
  y: [number, number] | null;
}

interface ChartMouseEvent {
  activeLabel?: string;
  activePayload?: Array<any>;
  chartX?: number;
  chartY?: number;
}

const generateLossData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  const currentDate = new Date(now);
  currentDate.setDate(currentDate.getDate() - 180);

  // Parameters for realistic loss patterns
  const baseLoss = 5000;  // Base loss amount
  const volatility = 0.15; // 15% daily volatility
  const trendGrowth = 0.10; // 10% annual growth rate
  const weeklyPattern = 0.20; // 20% weekly pattern
  let previousValue = baseLoss;

  for (let i = 0; i < 180; i++) {
    const dayOfWeek = currentDate.getDay();
    
    // Weekly pattern (higher losses mid-week)
    const weeklyFactor = 1 + weeklyPattern * Math.sin((2 * Math.PI * (dayOfWeek - 3)) / 7);
    
    // Growth trend
    const trendFactor = 1 + (i / 365) * trendGrowth;
    
    // Random variation
    const noise = 1 + (Math.random() - 0.5) * 2 * volatility;
    
    // Calculate target value
    const targetValue = baseLoss * weeklyFactor * trendFactor * noise;
    
    // Smooth the value
    const smoothedValue = Math.round(previousValue * 0.7 + targetValue * 0.3);
    previousValue = smoothedValue;

    data.push({
      date: new Date(currentDate).toISOString().split('T')[0],
      loss: smoothedValue
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
};

const aggregateData = (data: DataPoint[], days: number): DataPoint[] => {
  const aggregated = [];
  for (let i = 0; i < data.length; i += days) {
    const chunk = data.slice(i, Math.min(i + days, data.length));
    const avgValue = Math.round(
      chunk.reduce((sum, item) => sum + item.loss, 0) / chunk.length
    );
    aggregated.push({
      date: chunk[0].date,
      loss: avgValue,
    });
  }
  return aggregated;
};

const downloadAsCSV = (data: DataPoint[], filename: string) => {
  const headers = ['Date', 'Potential Loss'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => `${row.date},${row.loss}`)
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
        link.download = 'potential-loss.png';
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

const PotentialLossChart: React.FC = () => {
  const theme = useTheme();
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectionArea, setSelectionArea] = useState<{ left: string | null; right: string | null }>({ 
    left: null, 
    right: null 
  });
  const [zoomDomain, setZoomDomain] = useState<ZoomDomain>({ x: null, y: null });
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const dailyData = useMemo(() => generateLossData(), []);
  const data = useMemo(() => {
    switch (interval) {
      case 'weekly': return aggregateData(dailyData, 7);
      case 'monthly': return aggregateData(dailyData, 30);
      default: return dailyData;
    }
  }, [interval, dailyData]);

  const formatXAxis = (date: string) => {
    const d = new Date(date);
    switch (interval) {
      case 'daily':
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      case 'weekly':
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      case 'monthly':
        return d.toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit'
        });
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const formatTooltip = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const getXAxisInterval = useCallback(() => {
    if (zoomDomain.x) {
      const startDate = new Date(zoomDomain.x[0]);
      const endDate = new Date(zoomDomain.x[1]);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.floor(daysDiff / 10));
    }
    return Math.floor(data.length / 10);
  }, [zoomDomain.x, data.length]);

  const handleZoomReset = useCallback(() => {
    setZoomDomain({ x: null, y: null });
  }, []);

  const handleMouseDown = useCallback((e: ChartMouseEvent) => {
    if (!e?.activeLabel) return;
    setSelectionArea({ left: e.activeLabel, right: null });
  }, []);

  const handleMouseMove = useCallback((e: ChartMouseEvent) => {
    if (!selectionArea.left || !e?.activeLabel) return;
    setSelectionArea(prev => ({ 
      ...prev, 
      right: e.activeLabel || null 
    }));
  }, [selectionArea.left]);

  const handleMouseUp = useCallback(() => {
    if (!selectionArea.left || !selectionArea.right) {
      setSelectionArea({ left: null, right: null });
      return;
    }

    const leftIndex = data.findIndex(d => d.date === selectionArea.left);
    const rightIndex = data.findIndex(d => d.date === selectionArea.right);

    if (leftIndex === -1 || rightIndex === -1) {
      setSelectionArea({ left: null, right: null });
      return;
    }

    const [startIdx, endIdx] = [Math.min(leftIndex, rightIndex), Math.max(leftIndex, rightIndex)];
    const selectedData = data.slice(startIdx, endIdx + 1);

    const minY = Math.min(...selectedData.map(d => d.loss));
    const maxY = Math.max(...selectedData.map(d => d.loss));
    const yPadding = Math.max(10, (maxY - minY) * 0.1);

    setZoomDomain({
      x: [data[startIdx].date, data[endIdx].date],
      y: [Math.max(0, minY - yPadding), maxY + yPadding]
    });

    setSelectionArea({ left: null, right: null });
  }, [data, selectionArea]);

  const filteredData = useMemo(() => {
    if (!zoomDomain.x) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const startDate = new Date(zoomDomain.x![0]);
      const endDate = new Date(zoomDomain.x![1]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, zoomDomain.x]);

  const yDomain = useMemo(() => {
    if (zoomDomain.y) return zoomDomain.y;
    
    const allValues = data.map(d => d.loss);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    
    return [Math.max(0, min - padding), max + padding];
  }, [data, zoomDomain.y]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadOption = (format: 'csv' | 'image') => {
    if (format === 'csv') {
      downloadAsCSV(data, `potential-loss-${interval}.csv`);
    } else if (format === 'image') {
      downloadAsImage(chartRef);
    }
    handleClose();
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        position: 'relative'
      }}
      aria-label="Potential loss chart"
    >
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Day-wise Potential Loss
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Interval</InputLabel>
            <Select
              value={interval}
              label="Time Interval"
              onChange={(e) => {
                setInterval(e.target.value as 'daily' | 'weekly' | 'monthly');
                setZoomDomain({ x: null, y: null });
              }}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <MuiTooltip title="Download Options">
              <IconButton
                size="small"
                onClick={handleClick}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light + '20',
                  },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </MuiTooltip>
          </Box>
          {zoomDomain.x !== null && (
            <Button
              startIcon={<ZoomOutIcon />}
              onClick={handleZoomReset}
              variant="outlined"
              size="small"
              sx={{ 
                color: theme.palette.error.main,
                borderColor: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.dark,
                  backgroundColor: theme.palette.error.light + '20',
                }
              }}
            >
              Reset Zoom
            </Button>
          )}
        </Box>
      </Box>
      
      <Box 
        ref={chartRef}
        sx={{ 
          height: 350,
          position: 'relative',
          '& .recharts-text': {
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{
              top: 20,
              right: 30,
              left: 60,
              bottom: 60,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme.palette.divider}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={getXAxisInterval()}
              tick={{ 
                fill: theme.palette.text.secondary,
                fontSize: 12,
                dy: 25
              }}
              domain={zoomDomain?.x || ['dataMin', 'dataMax']}
              type="category"
              padding={{ left: 30, right: 30 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              label={{
                value: 'Potential Loss ($)',
                angle: -90,
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle',
                  fill: theme.palette.text.secondary,
                  fontWeight: 500,
                },
                dx: -45
              }}
              tick={{ 
                fill: theme.palette.text.secondary,
                fontSize: 12
              }}
              domain={yDomain}
              width={60}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={formatXAxis}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                boxShadow: theme.shadows[2],
              }}
              labelStyle={{ 
                color: theme.palette.text.primary,
                fontWeight: 500,
                marginBottom: 4
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="loss"
              stroke={theme.palette.error.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 6,
                fill: theme.palette.error.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
              }}
            />
            
            {selectionArea.left && selectionArea.right && (
              <ReferenceArea
                x1={selectionArea.left}
                x2={selectionArea.right}
                strokeOpacity={0.3}
                fill={theme.palette.error.main}
                fillOpacity={0.2}
              />
            )}
          </LineChart>
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
            <TableChartIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
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
            <ImageIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
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
    </Box>
  );
};

export default PotentialLossChart; 