import React, { FC, RefObject, useState } from 'react';
import { Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import { saveAs } from 'file-saver';
import * as Papa from 'papaparse';
import { ChartDataPoint } from '../../services/demandForecastService';

interface DownloadButtonProps {
  data: ChartDataPoint[];
  chartRef: RefObject<HTMLDivElement>;
}

const DownloadButton: FC<DownloadButtonProps> = ({ data, chartRef }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Function to download data as CSV
  const downloadCSV = () => {
    handleClose();
    
    if (!data || data.length === 0) {
      console.warn('No data available to download');
      return;
    }
    
    try {
      // Format data for CSV - flatten the structure
      const csvData = data.map(item => ({
        Date: item.date,
        'Actual Demand': item.demand,
        'Forecast': item.forecast,
        'Lower Bound': item.lowerBound,
        'Upper Bound': item.upperBound,
        'Revenue': item.revenue
      }));
      
      // Convert to CSV string
      const csv = Papa.unparse(csvData);
      
      // Create a blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `demand-forecast-data-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  // Function to download chart as image
  const downloadImage = () => {
    handleClose();
    
    if (!chartRef.current) {
      console.warn('Chart reference not available');
      return;
    }
    
    try {
      // Create a canvas from the chart
      const svg = chartRef.current.querySelector('svg');
      if (!svg) {
        console.warn('SVG element not found in chart');
        return;
      }
      
      // Convert SVG to canvas
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      const svgRect = svg.getBoundingClientRect();
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;
      
      // Create an image from SVG
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        // Draw image on canvas
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (blob) {
              saveAs(blob, `demand-forecast-chart-${new Date().toISOString().slice(0, 10)}.png`);
            }
          });
        }
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Error downloading image:', error);
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