"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ExpandedState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Checkbox,
  TextField,
  Menu,
  MenuItem,
  IconButton,
  Popover,
  Typography,
  Tooltip,
  Chip,
  Divider,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
} from "@mui/material";
import {
  DownloadOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ColumnHeightOutlined,
} from "@ant-design/icons";
import * as FileSaver from "file-saver";
import ManageUsersModal from "views/user-managment/modals/manage-users-modal";
import BackNav from "./back-navigation";

// Define the row data type
interface DataRow {
  id: number;
  emailId: string;
  userGroup: "Demo Account" | "Admin" | "boAt Demo Users";
  lastLogin: string;
  createdDate: string;
  subRows?: DataRow[];
  [key: string]: any;
}


// Enhanced sample data
const sampleData: DataRow[] = [
  { 
    id: 1, 
    emailId: "johnsmith@demo.com", 
    userGroup: "Admin", 
    lastLogin: "2023-07-15 14:23:45", 
    createdDate: "2022-08-25 15:23:25", 
    subRows: [
      { id: 101,  emailId: "admin@gmail.com", userGroup: "Admin",  lastLogin: "date", createdDate: "date" },
      { id: 102,  emailId: "admin@gmail.com", userGroup: "Admin",  lastLogin: "date", createdDate: "date"  },
    ]
  },
  { 
    id: 2, 
    emailId: "janedoe@demo.com", 
    userGroup: "Demo Account", 
    lastLogin: "2023-07-15 14:23:45", 
    createdDate: "2022-08-25 15:23:25", 
    subRows: [
      { id: 201,  emailId: "admin@demo.com", userGroup: "Admin",  lastLogin: "date", createdDate: "date" },
      { id: 202,  emailId: "admin@demo.com", userGroup: "Admin",  lastLogin: "date", createdDate: "date"  },
    ]
  },
  { 
    id: 3, 
    emailId: "sarahwilliams@demo.com", 
    userGroup: "Demo Account", 
    lastLogin: "2023-07-15 14:23:45", 
    createdDate: "2022-08-25 15:23:25", 
  },
  { 
    id: 4, 
    emailId: "davidjohnson@demo.com", 
    userGroup: "boAt Demo Users", 
    lastLogin: "2023-07-15 14:23:45", 
    createdDate: "2022-08-25 15:23:25", 
  },
  { 
    id: 5, 
    emailId: "michaelbrown@demo.com", 
    userGroup: "Admin", 
    lastLogin: "2023-07-15 14:23:45", 
    createdDate: "2022-08-25 15:23:25", 
  },
];

// Props interface for the manage users component
interface ManageUsersProps {
  data?: DataRow[];
  isLoading?: boolean;
  onAdd?: () => void;
  onDelete?: (selectedRows: number[]) => void;
  onRefresh?: () => void;
}

export default function ManageUsers({
  data = sampleData,
  isLoading = false,
  onAdd,
  onDelete,
  onRefresh,
}: ManageUsersProps) {
  const theme = useTheme();
  
  // Table state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  
  // UI state
  const [filterAnchorEls, setFilterAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState<null | HTMLElement>(null);
  const [pageSize, setPageSize] = useState(5);

  //modal state
  const [openModal, setOpenModal] = useState<boolean>(false);
  
  //modal open 
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenModal(true);
    onAdd;
  }
  
  const handleClose = () => {
    setOpenModal(false);
  }

  // Define columns with TypeScript typing
  const columns = useMemo<ColumnDef<DataRow, unknown>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableFiltering: false,
    },
    {
      accessorKey: "emailId",
      header: "Email ID",
      enableSorting: true,
      enableFiltering: true,
      cell: ({ row, getValue }) => (
        <Typography fontWeight={row.depth > 0 ? 'normal' : 'medium'}>
          {getValue() as string}
        </Typography>
      ),
    },
    {
      accessorKey: "userGroup",
      header: "User Group",
      enableSorting: true,
      enableFiltering: true,
      cell: ({ getValue }) => {
        const accessType = getValue() as string;
        let color;
        
        switch(accessType) {
          case 'Admin':
            color = 'error';
            break;
          case 'Demo Account':
            color = 'warning';
            break;
          case 'boAt Demo Users':
            color = 'success';
            break;
          default:
            color = 'default';
        }
        
        return accessType ? (
          <Chip 
            label={accessType.charAt(0).toUpperCase() + accessType.slice(1)} 
            color={color as any}
            size="small"
            variant="outlined"
          />
        ) : null;
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      enableSorting: true,
      enableFiltering: true,
      cell: ({ getValue }) => {
        const count = getValue() as number;
        return (
          <Typography
            sx={{ 
              fontWeight: count > 10 ? 'bold' : 'normal',
              color: count > 20 ? theme.palette.success.main : 'inherit'
            }}
          >
            {count}
          </Typography>
        );
      },
    },
    {
      accessorKey: "createdDate",
      header: "Date Created",
      enableSorting: true,
      enableFiltering: true,
      cell: ({ getValue }) => {
        const count = getValue() as number;
        return (
          <Typography
            sx={{ 
              fontWeight: count > 10 ? 'bold' : 'normal',
              color: count > 20 ? theme.palette.success.main : 'inherit'
            }}
          >
            {count}
          </Typography>
        );
      },
    },
  ], [theme]);

  const table = useReactTable({
    data,
    columns,
    state: { 
      columnVisibility, 
      columnFilters,
      sorting,
      expanded,
      globalFilter,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: row => Boolean(row.original.subRows?.length),
    enableRowSelection: true,
    enableExpanding: true,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Export CSV Function
  const handleExportCSV = () => {
    const visibleColumns = columns.filter(col => 
      col.id !== 'select' && 
      (columnVisibility[col.id as string] !== false)
    );
    
    const headers = visibleColumns.map(col => {
      // Use proper type checking for the column definition
      if (typeof col.header === 'string') {
        return col.header;
      } else if ('accessorKey' in col && col.accessorKey !== undefined) {
        return col.accessorKey as string;
      } else {
        return col.id;
      }
    }).join(',');
    
    const exportData = table.getFilteredRowModel().rows.map(row => {
      const rowData = row.original;
      return visibleColumns.map(col => {
        // Get the appropriate key for accessing the data
        let key: string = col.id || '';
        if ('accessorKey' in col && col.accessorKey !== undefined) {
          key = col.accessorKey as string;
        }
        
        // Handle arrays like permissions
        if (Array.isArray(rowData[key])) {
          return `"${rowData[key].join(', ')}"`;
        }
        
        // For permissions string, wrap in quotes to handle commas
        if (key === 'permissions') {
          return `"${rowData[key]}"`;
        }
        
        return rowData[key] !== undefined ? rowData[key] : '';
      }).join(',');
    }).join('\n');
    
    const csv = `${headers}\n${exportData}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, "manage-users-export.csv");
  };

  // Handle filter icon click
  const handleFilterClick = (columnId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEls({
      ...filterAnchorEls,
      [columnId]: event.currentTarget
    });
  };

  // Handle filter popover close
  const handleFilterClose = (columnId: string) => {
    setFilterAnchorEls({
      ...filterAnchorEls,
      [columnId]: null
    });
  };

  const selectedRows = Object.keys(rowSelection).length;

  return (
    <Paper 
      elevation={2}
      sx={{ 
        width: "100%", 
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      {/* Toolbar Section */}
      <Box 
        sx={{ 
          p: 2, 
          display: "flex", 
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.light, 0.1),
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {isLoading && <CircularProgress size={20} />}
        </Stack>
        
        <Stack direction="row" justifyContent="space-between" width="100%">
          <BackNav/>
          <Button
            startIcon={<PlusOutlined />}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleOpen}
          >
            Add New
          </Button>
          <ManageUsersModal open={openModal} handleClose={handleClose}/>
        </Stack>
      </Box>

      {/* Search and actions row */}
      <Box 
        sx={{ 
          p: 2, 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          placeholder="Search..."
          size="small"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <SearchOutlined style={{ marginRight: 8 }} />,
          }}
        />
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh}>
              <ReloadOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Column visibility">
            <IconButton onClick={(e) => setVisibilityAnchorEl(e.currentTarget)}>
              <ColumnHeightOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton onClick={handleExportCSV}>
              <DownloadOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Selected rows actions */}
      {selectedRows > 0 && (
        <Box 
          sx={{ 
            py: 1, 
            px: 2, 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Typography variant="subtitle2">
            {selectedRows} {selectedRows === 1 ? 'row' : 'rows'} selected
          </Typography>
          <Button 
            startIcon={<DeleteOutlined />} 
            color="error" 
            size="small"
            onClick={() => onDelete && onDelete(
              Object.keys(rowSelection).map(key => parseInt(key))
            )}
          >
            Delete Selected
          </Button>
        </Box>
      )}

      {/* Column Visibility Menu */}
      <Menu 
        anchorEl={visibilityAnchorEl} 
        open={Boolean(visibilityAnchorEl)} 
        onClose={() => setVisibilityAnchorEl(null)}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { minWidth: 180 }
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Toggle Columns
        </Typography>
        <Divider />
        {table.getAllLeafColumns().map((column) => {
          if (column.id === 'select') return null;
          
          return (
            <MenuItem key={column.id} dense>
              <Checkbox
                checked={column.getIsVisible()}
                onChange={(e) => column.toggleVisibility(e.target.checked)}
                edge="start"
                size="small"
              />
              <Typography variant="body2">
                {typeof column.columnDef.header === "string" 
                  ? column.columnDef.header 
                  : column.id}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Table Section */}
      <TableContainer sx={{ maxHeight: 500, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell 
                    key={header.id} 
                    sx={{ 
                      fontWeight: "bold", 
                      whiteSpace: 'nowrap',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.95)
                        : alpha(theme.palette.background.paper, 0.95),
                    }}
                    align={
                      header.id === 'select'
                        ? 'center' 
                        : (header.column.columnDef.meta as any)?.align || 'left'
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            userSelect: 'none',
                          }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <Box component="span" sx={{ ml: 0.5, display: 'inline-flex' }}>
                              {header.column.getIsSorted() === "asc" ? (
                                <SortAscendingOutlined style={{ fontSize: 14 }} />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <SortDescendingOutlined style={{ fontSize: 14 }} />
                              ) : (
                                <Box 
                                  sx={{ 
                                    opacity: 0.3, 
                                    fontSize: 14, 
                                    display: 'inline-flex',
                                    '&:hover': { opacity: 0.7 } 
                                  }}
                                >
                                  <SortAscendingOutlined />
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                        
                        {header.column.getCanFilter() && (
                          <>
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleFilterClick(header.column.id, e)}
                              sx={{ ml: 0.5 }}
                            >
                              <FilterOutlined style={{ 
                                fontSize: 14, 
                                color: header.column.getFilterValue() ? theme.palette.primary.main : 'inherit' 
                              }} />
                            </IconButton>
                            
                            <Popover
                              open={Boolean(filterAnchorEls[header.column.id])}
                              anchorEl={filterAnchorEls[header.column.id]}
                              onClose={() => handleFilterClose(header.column.id)}
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                              }}
                              transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                              }}
                            >
                              <Box p={2} width={200}>
                                <TextField
                                  autoFocus
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  placeholder={`Filter ${typeof header.column.columnDef.header === 'string' 
                                    ? header.column.columnDef.header 
                                    : header.column.id}...`}
                                  value={(header.column.getFilterValue() as string) || ""}
                                  onChange={(e) => header.column.setFilterValue(e.target.value)}
                                />
                              </Box>
                            </Popover>
                          </>
                        )}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Loading data...</Typography>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">No data available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  hover 
                  selected={row.getIsSelected()}
                  sx={{ 
                    '&.MuiTableRow-root.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.primary.main, 0.1),
                    },
                    ...(row.depth > 0 && {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.default, 0.3)
                        : alpha(theme.palette.background.default, 0.3),
                    })
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      sx={{ 
                        ...(row.depth > 0 && { pl: `${row.depth * 2 + 2}rem` }),
                        ...(cell.column.id === 'select' && { width: 40, p: 0.5 }),
                        cursor: row.getCanExpand() ? 'pointer' : 'default'
                      }}
                      align={
                        cell.column.id === 'select'
                          ? 'center' 
                          : (cell.column.columnDef.meta as any)?.align || 'left'
                      }
                      onClick={() => {
                        if (cell.column.id !== 'select' && row.getCanExpand()) {
                          row.toggleExpanded();
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination & Page Size */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <FormControl size="small" variant="outlined" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="page-size-label">Rows per page</InputLabel>
          <Select
            labelId="page-size-label"
            id="page-size-select"
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              table.setPageSize(newSize);
            }}
            label="Rows per page"
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TablePagination
          component="div"
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={(e) => {
            const size = Number(e.target.value);
            setPageSize(size);
            table.setPageSize(size);
          }}
          rowsPerPageOptions={[]} // Hide duplicate row selector
          sx={{ 
            border: 'none',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              my: 1,
            },
          }}
        />
      </Box>
    </Paper>
  );
}