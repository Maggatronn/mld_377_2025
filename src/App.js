import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Edit as EditIcon, Delete as DeleteIcon, NetworkCheck as NetworkIcon, Timeline as TimelineIcon, Search as SearchIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import ForceGraph from './ForceGraph';
import SankeyDiagram from './SankeyDiagram';
import { fetchRecords, createRecord, updateRecord, deleteRecord } from './services/databaseService';
import './App.css';

function App() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizer: '',
    organizee: '',
    event: '',
    status: '',
    leadership: '3',
    date: dayjs()
  });
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewType, setViewType] = useState('network');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const records = await fetchRecords();
      const formattedRecords = records.map(record => ({
        ...record,
        date: dayjs(record.date)
      }));
      setTableData(formattedRecords);
      setFilteredData(formattedRecords);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setEditIndex(null);
    setFormData({
      organizer: '',
      organizee: '',
      event: '',
      status: '',
      leadership: '3',
      date: dayjs()
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditIndex(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editIndex !== null) {
        const record = tableData[editIndex];
        await updateRecord(record.id, formData);
      } else {
        await createRecord(formData);
      }
      await loadData();
      handleClose();
    } catch (err) {
      setError('Failed to save data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData({
      ...tableData[index],
      date: dayjs(tableData[index].date)
    });
    setOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await deleteRecord(deleteId);
      await loadData();
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError('Failed to delete record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleViewTypeChange = (event, newViewType) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };

  // Sorting function
  const descendingComparator = (a, b, orderBy) => {
    if (orderBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    }
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter function
  const filterData = (data) => {
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(tableSearchTerm.toLowerCase())
      )
    );
  };

  // Sort and filter data
  const sortAndFilterData = (data) => {
    const filteredData = filterData(data);
    return filteredData.sort(getComparator(order, orderBy));
  };

  if (loading && tableData.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="App" style={{ height: '100vh' }}>
      <Box sx={{ 
        height: '100%',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Left Column - Table */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Network Data
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Search table..."
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="contained" onClick={handleClickOpen}>
                    Add New Entry
                  </Button>
                </Box>
              </Box>
              <TableContainer sx={{ maxHeight: 'calc(100% - 60px)' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'date'}
                          direction={orderBy === 'date' ? order : 'asc'}
                          onClick={() => handleRequestSort('date')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'organizer'}
                          direction={orderBy === 'organizer' ? order : 'asc'}
                          onClick={() => handleRequestSort('organizer')}
                        >
                          Organizer
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'organizee'}
                          direction={orderBy === 'organizee' ? order : 'asc'}
                          onClick={() => handleRequestSort('organizee')}
                        >
                          Organizee
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'event'}
                          direction={orderBy === 'event' ? order : 'asc'}
                          onClick={() => handleRequestSort('event')}
                        >
                          Event
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'leadership'}
                          direction={orderBy === 'leadership' ? order : 'asc'}
                          onClick={() => handleRequestSort('leadership')}
                        >
                          Leadership
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortAndFilterData(tableData).map((row, index) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{dayjs(row.date).format('MM/DD/YYYY')}</TableCell>
                        <TableCell>{row.organizer}</TableCell>
                        <TableCell>{row.organizee}</TableCell>
                        <TableCell>{row.event}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.leadership}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(index)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteClick(row.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Right Column - Visualization */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Paper elevation={3} sx={{ 
              p: 2, 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {viewType === 'network' ? 'Network Visualization' : 'Leadership Flow'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 200 }}
                  />
                  <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={handleViewTypeChange}
                    aria-label="visualization type"
                    size="small"
                  >
                    <ToggleButton value="network" aria-label="network view">
                      <NetworkIcon />
                    </ToggleButton>
                    <ToggleButton value="sankey" aria-label="sankey view">
                      <TimelineIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              <Box sx={{ flex: 1, position: 'relative' }}>
                {viewType === 'network' ? (
                  <ForceGraph data={tableData} searchTerm={searchTerm} />
                ) : (
                  <SankeyDiagram data={tableData} searchTerm={searchTerm} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editIndex !== null ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => setFormData({ ...formData, date: newValue })}
              slotProps={{
                textField: {
                  margin: "dense",
                  fullWidth: true,
                  variant: "outlined"
                }
              }}
            />
          </LocalizationProvider>
          <Autocomplete
            freeSolo
            options={[...new Set(tableData.map(item => item.organizer))].filter(Boolean)}
            value={formData.organizer || ''}
            onInputChange={(event, newValue) => {
              setFormData({ ...formData, organizer: newValue || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Organizer" fullWidth variant="outlined" />
            )}
            getOptionLabel={(option) => option?.toString() || ''}
          />
          <Autocomplete
            freeSolo
            options={[...new Set(tableData.map(item => item.organizee))].filter(Boolean)}
            value={formData.organizee || ''}
            onInputChange={(event, newValue) => {
              setFormData({ ...formData, organizee: newValue || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Organizee" fullWidth variant="outlined" />
            )}
            getOptionLabel={(option) => option?.toString() || ''}
          />
          <Autocomplete
            freeSolo
            options={[...new Set(tableData.map(item => item.event))].filter(Boolean)}
            value={formData.event || ''}
            onInputChange={(event, newValue) => {
              setFormData({ ...formData, event: newValue || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Event" fullWidth variant="outlined" />
            )}
            getOptionLabel={(option) => option?.toString() || ''}
          />
          <TextField
            margin="dense"
            name="status"
            label="Status"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.status}
            onChange={handleChange}
          />
          <FormControl margin="dense">
            <FormLabel>Leadership Level</FormLabel>
            <RadioGroup
              row
              name="leadership"
              value={formData.leadership}
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <FormControlLabel
                  key={value}
                  value={value.toString()}
                  control={<Radio />}
                  label={
                    value === 1 ? 'Very Low' :
                    value === 2 ? 'Low' :
                    value === 3 ? 'Moderate' :
                    value === 4 ? 'High' :
                    'Very High'
                  }
                />
              ))}
            </RadioGroup>
            <FormHelperText>Rate leadership level from 1 (lowest) to 5 (highest)</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (editIndex !== null ? 'Save' : 'Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this entry?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
