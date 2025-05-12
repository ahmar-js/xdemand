import * as React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { Checkbox, CircularProgress, TextField, Select, MenuItem, FormControl, InputLabel, Tooltip, ListItemSecondaryAction as MuiListItemSecondaryAction, SelectChangeEvent, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDemandForecastData } from '../../hooks/useDemandForecast';
import { DemandDataPoint, getUniqueValues } from '../../services/demandForecastService';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}));

// Filter category types
type FilterCategory = 'Linn_Category' | 'Linn_Title' | 'Channel' | 'im_sku' | 'warehouse_code' | 'Company' | 'Region';

// Display names for the filter categories
const displayNames: Record<FilterCategory, string> = {
  'Linn_Category': 'Category',
  'Linn_Title': 'Title',
  'Channel': 'Channel',
  'im_sku': 'SKU',
  'warehouse_code': 'Warehouse',
  'Company': 'Company',
  'Region': 'Region'
};

// Filter item structure
type FilterItem = {
  id: string;
  name: string;
  selected: boolean;
  disabled: boolean;
};

// Filter data structure
type FilterData = {
  [key in FilterCategory]: FilterItem[];
};

// Function to create initial empty filter data
const createInitialFilterData = (): FilterData => {
  const categories = ['Linn_Category', 'Linn_Title', 'Channel', 'im_sku', 'warehouse_code', 'Company', 'Region'] as FilterCategory[];
  return categories.reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as FilterData);
};

// Add a constant to track disabled categories
const disabledCategories: FilterCategory[] = [];

// Function to create initial empty selected filters
const createInitialSelectedFilters = (): Record<FilterCategory, string[]> => {
  const categories = ['Linn_Category', 'Linn_Title', 'Channel', 'im_sku', 'warehouse_code', 'Company', 'Region'] as FilterCategory[];
  return categories.reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<FilterCategory, string[]>);
};

// Type for a saved preset
interface FilterPreset {
  name: string;
  filters: Record<FilterCategory, string[]>;
}

// Props interface
interface AdvanceFilterDialogProps {
  handleClose: () => void;
  open: boolean;
  title: string;
  onApplyFilters: (selectedFilters: Record<FilterCategory, string[]>) => void;
}

export default function AdvanceFilterDialog({ handleClose, open, title, onApplyFilters }: AdvanceFilterDialogProps) {
  // Fetch data from API
  const { data: apiData, isLoading } = useDemandForecastData();
  
  // Store the full raw data fetched from the API
  const [rawData, setRawData] = React.useState<DemandDataPoint[]>([]);
  // Store filters passed in props for internal use
  const [appliedFiltersInternal, setAppliedFiltersInternal] = React.useState<FilterData>(createInitialFilterData());
  // Store the full set of initial filter options
  const [initialFilters, setInitialFilters] = React.useState<FilterData>(createInitialFilterData());
  // State to hold currently selected items across all categories
  const [selectedFilters, setSelectedFilters] = React.useState<Record<FilterCategory, string[]>>(createInitialSelectedFilters());
  // State for currently displayed filters (after search/dynamic filtering)
  const [displayedFilters, setDisplayedFilters] = React.useState<FilterData>(createInitialFilterData());
  
  // State for current category
  const [currentCategory, setCurrentCategory] = React.useState<FilterCategory>('Linn_Category');
  // State for search query
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  // State for loading filter data
  const [isFilterLoading, setIsFilterLoading] = React.useState<boolean>(true);

  // State for saved filter presets
  const [presets, setPresets] = React.useState<FilterPreset[]>([]);
  const [selectedPresetName, setSelectedPresetName] = React.useState<string>('');

  // State for summary panel expansion
  const [summaryExpanded, setSummaryExpanded] = React.useState<boolean>(false);

  // Load presets from localStorage on mount
  React.useEffect(() => {
    const savedPresets = localStorage.getItem('demandFilterPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Error parsing saved filter presets:", e);
        localStorage.removeItem('demandFilterPresets'); // Clear corrupted data
      }
    }
  }, []);

  // Save presets to localStorage whenever they change
  React.useEffect(() => {
    if (presets.length > 0) { // Only save if there are presets to avoid storing empty array initially
      localStorage.setItem('demandFilterPresets', JSON.stringify(presets));
    }
  }, [presets]);

  // 1. Fetch raw data and populate initialFilters
  React.useEffect(() => {
    if (apiData && apiData.length > 0 && rawData.length === 0) { // Fetch raw data only once
      setIsFilterLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      fetch(`${apiUrl}/csv-to-json`)
        .then(response => response.json())
        .then((data: DemandDataPoint[]) => {
          setRawData(data);
          const newFilters: FilterData = { Linn_Category: [], Linn_Title: [], Channel: [], im_sku: [], warehouse_code: [], Company: [], Region: [] };
          
          Object.keys(newFilters).forEach(category => {
            const key = category as FilterCategory;
            const uniqueValues = getUniqueValues(data, key);
            newFilters[key] = uniqueValues.map((value, index) => ({
              id: `${key}-${index}`,
              name: value,
              selected: false,
              disabled: false
            }));
          });
          
          setInitialFilters(newFilters);
          setDisplayedFilters(newFilters); // Initially display all options
          setIsFilterLoading(false);
        })
        .catch(error => {
          console.error('Error fetching filter data:', error);
          setIsFilterLoading(false);
        });
    }
  }, [apiData, rawData]); // Depend on rawData length to avoid re-fetching

  // 2. Recalculate available filters whenever selections change
  React.useEffect(() => {
    if (rawData.length === 0 || Object.keys(initialFilters).length === 0) return;

    // Recalculate available options for each category based on selections in OTHER categories
    const newDisplayedFilters: FilterData = createInitialFilterData();
    
    Object.keys(initialFilters).forEach(category => {
      const currentCategoryKey = category as FilterCategory;

      // Filter raw data based on selections in all OTHER categories
      const filteredDataForThisCategory = rawData.filter(item => {
        return Object.entries(selectedFilters).every(([otherCategory, selectedValues]) => {
          if (otherCategory === currentCategoryKey) return true;
          if (selectedValues.length === 0) return true;
          const otherCategoryKey = otherCategory as keyof DemandDataPoint;
          const itemValue = String(item[otherCategoryKey] || '');
          return selectedValues.includes(itemValue);
        });
      });

      // Get unique available values for the current category from the filtered data
      const availableValues = getUniqueValues(filteredDataForThisCategory, currentCategoryKey);
      
      // Map over all initial items, set disabled status based on availability
      newDisplayedFilters[currentCategoryKey] = initialFilters[currentCategoryKey]
        .map(initialItem => {
          const isAvailable = availableValues.includes(initialItem.name);
          return {
            ...initialItem,
            selected: selectedFilters[currentCategoryKey]?.includes(initialItem.name) ?? false, 
            disabled: !isAvailable // Set disabled if NOT available
          };
        });
    });

    setDisplayedFilters(newDisplayedFilters);

  }, [selectedFilters, rawData, initialFilters]);

  // Get filtered items for the currently selected category based on search query
  const filteredItems = React.useMemo(() => {
    return displayedFilters[currentCategory]?.filter((item) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [searchQuery, currentCategory, displayedFilters]);

  // Handle category selection - prevent selecting disabled categories
  const handleCategorySelect = (category: FilterCategory) => {
    if (!disabledCategories.includes(category)) {
      setCurrentCategory(category);
      setSearchQuery('');
    }
  };

  // Handle item selection toggle - updates the internal selectedFilters state
  const handleItemToggle = (item: FilterItem) => {
    if (item.disabled) return; // Prevent toggling disabled items

    setSelectedFilters(prevSelected => {
      const currentSelection = prevSelected[currentCategory] || [];
      const isSelected = currentSelection.includes(item.name);
      let newSelection: string[];

      if (isSelected) {
        newSelection = currentSelection.filter(name => name !== item.name);
      } else {
        newSelection = [...currentSelection, item.name]; // Simple toggle logic
      }
      
      return {
        ...prevSelected,
        [currentCategory]: newSelection
      };
    });
    
    // Reset selected preset name if filters are manually changed
    setSelectedPresetName(''); 
  };

  // Count selected items for the current category based on selectedFilters
  const getSelectedCount = (category: FilterCategory): string => {
    const selectedCount = selectedFilters[category]?.length || 0;
    
    // Count only non-disabled items from the displayed filters
    const availableCount = displayedFilters[category]?.filter(item => !item.disabled).length || 0;
    
    return `${selectedCount}/${availableCount}`;
  };

  // Handle select all items visible in the current category (matching search and not disabled)
  const handleSelectAll = () => {
    setSelectedFilters(prevSelected => {
      // Filter for items that match search AND are not disabled
      const itemsToSelect = filteredItems.filter(item => !item.disabled).map(item => item.name);
      const currentSelection = prevSelected[currentCategory] || [];
      
      // Combine current selection with newly selected items, avoiding duplicates
      const newSelection = Array.from(new Set([...currentSelection, ...itemsToSelect]));
      
      return {
        ...prevSelected,
        [currentCategory]: newSelection
      };
    });
    setSelectedPresetName(''); // Clear preset selection as filters changed
  };

  // Handle clear all selections for the current category
  const handleClearAll = () => {
    setSelectedFilters(prevSelected => ({
      ...prevSelected,
      [currentCategory]: []
    }));
    setSelectedPresetName(''); // Clear preset selection
  };
  
  // Reset all filters to their initial state
  const handleResetFilters = () => {
    setSelectedFilters(createInitialSelectedFilters());
    setDisplayedFilters(initialFilters); // Reset displayed to the full initial set
    setSearchQuery('');
    setCurrentCategory('Linn_Category'); // Reset to default category
  };

  // Apply filters - passes the internal selectedFilters state to the parent
  const handleApplyFilters = () => {
    onApplyFilters(selectedFilters);
    handleClose();
  };

  // --- Preset Handlers ---
  
  // Handle saving the current filter selection as a preset
  const handleSavePreset = () => {
    const presetName = prompt("Enter a name for this filter preset:");
    if (presetName && presetName.trim() !== "") {
      // Check if name already exists
      if (presets.some(p => p.name === presetName.trim())) {
        alert("A preset with this name already exists. Please choose a different name.");
        return;
      }
      const newPreset: FilterPreset = {
        name: presetName.trim(),
        filters: { ...selectedFilters } // Save a copy of the current selections
      };
      setPresets(prevPresets => [...prevPresets, newPreset]);
      alert(`Preset "${presetName.trim()}" saved.`);
    } else if (presetName !== null) { // User clicked OK but entered nothing
        alert("Preset name cannot be empty.");
    }
  };

  // Handle selecting and applying a preset
  const handleSelectPreset = (event: SelectChangeEvent<string>) => {
    const presetName = event.target.value;
    const selectedPreset = presets.find(p => p.name === presetName);
    if (selectedPreset) {
      setSelectedFilters({ ...selectedPreset.filters });
      setSelectedPresetName(presetName);
      // The useEffect watching selectedFilters will update displayedFilters
    } else {
      setSelectedPresetName(''); // Clear selection if preset not found (e.g., empty option)
    }
  };
  
  // Handle deleting a preset
  const handleDeletePreset = (presetName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the MenuItem click from closing the menu
    if (window.confirm(`Are you sure you want to delete the preset \"${presetName}\"?`)) {
        setPresets(prevPresets => prevPresets.filter(p => p.name !== presetName));
        if (selectedPresetName === presetName) {
            setSelectedPresetName(''); // Clear selection if the deleted preset was selected
        }
    }
  };
  
  // --- Handler to remove a filter directly from the summary chip ---
  const handleRemoveFilterFromSummary = (category: FilterCategory, valueToRemove: string) => {
    setSelectedFilters(prevSelected => {
      const currentSelection = prevSelected[category] || [];
      const newSelection = currentSelection.filter(name => name !== valueToRemove);
      return {
        ...prevSelected,
        [category]: newSelection
      };
    });
    // Optionally, reset selected preset name if filters no longer match
    setSelectedPresetName(''); 
  };

  // --- End Preset Handlers ---

  // Calculate total applied filters count for the summary
  const totalAppliedFilterCount = React.useMemo(() => {
    return Object.values(selectedFilters).reduce((count, filters) => count + filters.length, 0);
  }, [selectedFilters]);

  // Calculate the count of raw data records matching the current selection
  const matchingRecordCount = React.useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return 0;
    }
    const count = rawData.filter(item => {
      return Object.entries(selectedFilters).every(([category, selectedValues]) => {
        if (selectedValues.length === 0) return true; // No filter applied for this category
        const categoryKey = category as keyof DemandDataPoint;
        const itemValue = String(item[categoryKey] || '');
        return selectedValues.includes(itemValue);
      });
    }).length;
    return count;
  }, [selectedFilters, rawData]);

  return (
    <React.Fragment>
      <BootstrapDialog 
        onClose={handleClose} 
        aria-labelledby="customized-dialog-title" 
        maxWidth="md" 
        fullWidth={true} 
        open={open} 
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          {title}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500]
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          {/* Preset Selection Dropdown */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl fullWidth size="small">
              <Select
                labelId="preset-select-label"
                value={selectedPresetName}
                onChange={handleSelectPreset}
                displayEmpty
              >
                <MenuItem value="">
                  <em>None (Current Filters)</em>
                </MenuItem>
                {presets.length > 0 && <Divider sx={{ my: 0.5 }} />} {/* Divider */} 
                {presets.length === 0 && (
                  <MenuItem disabled>No presets saved yet</MenuItem> /* Empty State */
                )}
                {[...presets] // Create a copy before sorting
                  .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                  .map((preset) => (
                  <MenuItem 
                    key={preset.name} 
                    value={preset.name} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      '& .delete-preset-icon': { // Target the delete icon class
                        visibility: 'hidden' // Hide by default
                      },
                      '&:hover .delete-preset-icon': { // Show on menu item hover
                        visibility: 'visible'
                      }
                    }}
                  >
                    {preset.name}
                    <Tooltip title="Delete Preset">
                      <IconButton 
                        className="delete-preset-icon" // Add class for hover targeting
                        size="small" 
                        onClick={(e) => handleDeletePreset(preset.name, e)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Filter Summary Accordion */}
          <Accordion 
            expanded={summaryExpanded} 
            onChange={() => setSummaryExpanded(!summaryExpanded)}
            sx={{ mb: 2, border: '1px solid', borderColor: 'divider', '&.Mui-expanded': { mb: 2 } }} // Ensure margin consistency
            elevation={0} // Flat look
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="filter-summary-content"
              id="filter-summary-header"
              sx={{ 
                backgroundColor: 'action.hover', // Slight background tint
                minHeight: '40px', // Smaller height
                '& .MuiAccordionSummary-content': { my: 0.5 } // Reduce vertical margin
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Applied Filters Summary ({totalAppliedFilterCount} applied)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1, maxHeight: 150, overflowY: 'auto' }}>
              {totalAppliedFilterCount === 0 ? (
                <Typography variant="caption" color="textSecondary">
                  No filters currently applied.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(selectedFilters)
                    .filter(([_, values]) => values.length > 0) // Only show categories with selections
                    .map(([category, values]) => (
                      <Box key={category}>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                          {displayNames[category as FilterCategory]}:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {values.map(value => (
                            <Chip
                              key={value}
                              label={value}
                              size="small"
                              onDelete={() => handleRemoveFilterFromSummary(category as FilterCategory, value)}
                              color="primary"
                              variant="outlined"
                              sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on extra-small screens
            gap: 2,
            minHeight: 500
          }}>
            <Box sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 360 }, // Full width on xs, fixed on sm+
              maxHeight: { xs: 150, sm: 'none' }, // Limit height when stacked
              overflowY: { xs: 'auto', sm: 'visible' }, // Allow scroll when stacked
              bgcolor: 'background.paper',
              mb: { xs: 2, sm: 0 } // Add margin bottom when stacked
            }}>
              <nav aria-label="secondary filters folders">
                <List dense>
                  {Object.keys(displayedFilters).map((category) => {
                    const isDisabled = disabledCategories.includes(category as FilterCategory);
                    const hasSelection = selectedFilters[category as FilterCategory]?.length > 0; // Check if category has selections
                    return (
                      <ListItem key={category} disablePadding>
                        <ListItemButton 
                          selected={currentCategory === category} 
                          onClick={() => handleCategorySelect(category as FilterCategory)}
                          dense
                          sx={{ 
                            py: 0.5,
                            color: isDisabled ? 'text.disabled' : 'inherit',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            pointerEvents: isDisabled ? 'auto' : 'auto',
                            opacity: isDisabled ? 0.5 : 1
                          }}
                          disabled={isDisabled}
                        >
                          {hasSelection && <FilterListIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />} {/* Render icon if selected */}
                          <ListItemText 
                            primary={displayNames[category as FilterCategory]} 
                            primaryTypographyProps={{ 
                              fontSize: '0.875rem',
                              color: isDisabled ? 'text.disabled' : 'inherit'
                            }}
                          />
                          <ListItemSecondaryAction>
                            <Typography 
                              variant="body2" 
                              color={isDisabled ? 'text.disabled' : 'textSecondary'} 
                              fontSize="0.75rem"
                            >
                              {isDisabled ? 'Disabled' : getSelectedCount(category as FilterCategory)}
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </nav>
            </Box>
            <Divider 
              orientation="horizontal"
              variant="middle" 
              flexItem 
              sx={{ 
                my: { xs: 1, sm: 0 },
                display: { xs: 'block', sm: 'none' }
              }}
            />
            <Divider 
              orientation="vertical"
              variant="middle" 
              flexItem 
              sx={{ 
                display: { xs: 'none', sm: 'block' }
              }}
            />
            <Box sx={{ width: '100%', maxWidth: '100%', bgcolor: 'background.paper' }}>
              <TextField
                label="Search Items"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                margin="dense"
              />
              <Box sx={{ maxHeight: { xs: 250, sm: 480 }, overflowY: 'auto' }}>
                {isFilterLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : filteredItems.length > 0 ? (
                  <List dense>
                    {filteredItems.map((item, index) => (
                      <ListItem key={item.id} divider dense disablePadding>
                        <ListItemButton 
                          onClick={() => handleItemToggle(item)}
                          dense
                          disabled={item.disabled}
                          sx={{
                            py: 0.5,
                            cursor: item.disabled ? 'not-allowed' : 'pointer',
                            color: item.disabled ? 'text.disabled' : 'inherit'
                          }}
                        >
                          <Checkbox 
                            edge="start"
                            checked={item.selected}
                            tabIndex={-1}
                            disableRipple
                            size="small"
                            disabled={item.disabled}
                          />
                          <ListItemText 
                            primary={item.name} 
                            primaryTypographyProps={{ 
                              fontSize: '0.875rem',
                              color: item.disabled ? 'text.disabled' : 'inherit'
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography variant="body2" color="textSecondary">
                      {searchQuery ? 'No items match your search' : 'No items available'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Stack actions on xs
            alignItems: { xs: 'stretch', sm: 'center' }, // Stretch buttons on xs
            justifyContent: 'space-between',
            width: '100%',
            px: 2,
            gap: { xs: 1, sm: 0 } // Add gap when stacked
          }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, alignItems: 'center' }}> {/* Align items center */}
              {!isFilterLoading && (
                <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>
                  {matchingRecordCount} records match
                </Typography>
              )}
              <Button color="primary" onClick={handleSelectAll} size="small" sx={{ flexGrow: { xs: 1, sm: 0 } }}> {/* Allow grow on xs */}
                Select All
              </Button>
              <Button color="secondary" onClick={handleClearAll} size="small" sx={{ flexGrow: { xs: 1, sm: 0 } }}> {/* Allow grow on xs */}
                Clear All
              </Button>
              <Button onClick={handleResetFilters} color="error" size="small" sx={{ flexGrow: { xs: 1, sm: 0 } }}> {/* Add Reset Button */}
                Reset Filters
              </Button>
              <Button onClick={handleSavePreset} size="small" color="warning" sx={{ flexGrow: { xs: 1, sm: 0 } }}> 
                 Save Current Filters
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-end' }, flexWrap: 'wrap', alignItems: 'center' }}> 

              <Button onClick={handleClose} color="secondary" sx={{ flexGrow: { xs: 1, sm: 0 } }}> 
                Cancel
              </Button>
              <Button onClick={handleApplyFilters} variant="contained" color="primary" sx={{ flexGrow: { xs: 1, sm: 0 } }}> 
                Apply Filters
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </BootstrapDialog>
    </React.Fragment>
  );
}
