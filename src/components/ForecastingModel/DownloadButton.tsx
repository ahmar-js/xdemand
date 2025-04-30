import React, { FC, RefObject, useState } from 'react';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import { saveAs } from 'file-saver';
import * as Papa from 'papaparse';

// Define the types of data for both trend and seasonality charts
interface TrendDataPoint {
  date: string;
  trend: number;
}

interface SeasonalityDataPoint {
  date: string;
  'Daily Seasonality'?: number;
  'Weekly Seasonality'?: number;
  'Monthly Seasonality'?: number;
  'Yearly Seasonality'?: number;
  [key: string]: any; // This will handle any other properties
}

interface DownloadButtonProps {
  trendData: TrendDataPoint[];
  seasonalityData: SeasonalityDataPoint[];
  trendChartRef: RefObject<HTMLDivElement>;
  seasonalityChartRef: RefObject<HTMLDivElement>;
  metric: 'quantity' | 'revenue';
  interval: 'daily' | 'weekly' | 'monthly';
}

const DownloadButton: FC<DownloadButtonProps> = ({ 
  trendData, 
  seasonalityData, 
  trendChartRef, 
  seasonalityChartRef,
  metric,
  interval
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Function to download combined data as CSV
  const downloadCSV = () => {
    handleClose();
    
    if ((!trendData || trendData.length === 0) && (!seasonalityData || seasonalityData.length === 0)) {
      console.warn('No data available to download');
      return;
    }
    
    try {
      // Combine and prepare data for CSV
      const mergedData = trendData.map(trendItem => {
        // Find matching seasonality data by date
        const seasonalityItem = seasonalityData.find(item => item.date === trendItem.date) || {} as SeasonalityDataPoint;
        
        // Get the proper seasonality key based on interval
        const seasonalityKey = interval === 'daily' 
          ? 'Daily Seasonality' 
          : interval === 'weekly' 
            ? 'Weekly Seasonality' 
            : 'Monthly Seasonality';
        
        // Get seasonality values safely
        const periodValue = seasonalityKey in seasonalityItem ? seasonalityItem[seasonalityKey] || 0 : 0;
        const yearlyValue = 'Yearly Seasonality' in seasonalityItem ? seasonalityItem['Yearly Seasonality'] || 0 : 0;
        
        return {
          Date: trendItem.date,
          [`${metric === 'quantity' ? 'Quantity' : 'Revenue'} Trend`]: trendItem.trend,
          [seasonalityKey]: periodValue,
          'Yearly Seasonality': yearlyValue
        };
      });
      
      // Convert to CSV string
      const csv = Papa.unparse(mergedData);
      
      // Create a blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `forecasting-model-data-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };
  
  // Function to download combined charts as a single image
  const downloadImage = async () => {
    handleClose();
    
    if (!trendChartRef.current || !seasonalityChartRef.current) {
      console.warn('Chart references not available');
      return;
    }
    
    try {
      // Get SVGs from both charts
      const trendSvg = trendChartRef.current.querySelector('svg');
      const seasonalitySvg = seasonalityChartRef.current.querySelector('svg');
      
      if (!trendSvg || !seasonalitySvg) {
        console.warn('SVG elements not found in charts');
        return;
      }
      
      // Create a combined canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Could not get canvas context');
        return;
      }
      
      // Set canvas dimensions to fit both charts stacked vertically
      const trendRect = trendSvg.getBoundingClientRect();
      const seasonalityRect = seasonalitySvg.getBoundingClientRect();
      
      // Use max width of either chart and sum of heights plus some padding
      const canvasWidth = Math.max(trendRect.width, seasonalityRect.width);
      const canvasHeight = trendRect.height + seasonalityRect.height + 20; // 20px padding between charts
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert both SVGs to data URLs for images
      const trendSvgData = new XMLSerializer().serializeToString(trendSvg);
      const seasonalitySvgData = new XMLSerializer().serializeToString(seasonalitySvg);
      
      const trendBlob = new Blob([trendSvgData], { type: 'image/svg+xml;charset=utf-8' });
      const seasonalityBlob = new Blob([seasonalitySvgData], { type: 'image/svg+xml;charset=utf-8' });
      
      const trendUrl = URL.createObjectURL(trendBlob);
      const seasonalityUrl = URL.createObjectURL(seasonalityBlob);
      
      // Draw images on canvas in sequence
      const trendImg = new Image();
      const seasonalityImg = new Image();
      
      // First draw trend chart
      trendImg.onload = () => {
        ctx.drawImage(trendImg, 0, 0);
        URL.revokeObjectURL(trendUrl);
        
        // Then draw seasonality chart below it
        seasonalityImg.onload = () => {
          ctx.drawImage(seasonalityImg, 0, trendRect.height + 20); // Add 20px spacing
          URL.revokeObjectURL(seasonalityUrl);
          
          // Add titles between the charts for clarity
        //   ctx.font = '12px Arial';
        //   ctx.fillStyle = '#333';
        //   ctx.textAlign = 'left';
        //   ctx.fillText(`${metric === 'quantity' ? 'Quantity' : 'Revenue'} Trend Component`, 10, trendRect.height + 15);
          
          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (blob) {
              saveAs(blob, `forecasting-model-components-${new Date().toISOString().slice(0, 10)}.png`);
            }
          });
        };
        
        seasonalityImg.src = seasonalityUrl;
      };
      
      trendImg.src = trendUrl;
      
    } catch (error) {
      console.error('Error downloading combined image:', error);
    }
  };
  
  return (
    <Box>
      <Tooltip title="Download">
        <IconButton
          onClick={handleClick}
          aria-controls={open ? 'download-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="download-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'download-button',
        }}
      >
        <MenuItem onClick={downloadCSV}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={downloadImage}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Image</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DownloadButton; 