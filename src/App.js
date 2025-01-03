import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import ForceGraph from './ForceGraph';
import SankeyDiagram from './SankeyDiagram';
import { initialData } from './data/initialData';

function App() {
  const [data, setData] = useState(initialData.map(item => ({
    ...item,
    date: dayjs(item.date),
    id: Math.random().toString(36).substr(2, 9) // Add unique IDs for the table
  })));
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizer: '',
    organizee: '',
    event: '',
    leadership: '3',
    date: dayjs()
  });
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('force');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  const handleClickOpen = () => {
    setEditIndex(null);
    setFormData({
      organizer: '',
      organizee: '',
      event: '',
      leadership: '3',
      date: dayjs()
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditIndex(null);
  };

  const handleSubmit = () => {
    const newEntry = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9)
    };

    if (editIndex !== null) {
      const newData = [...data];
      newData[editIndex] = newEntry;
      setData(newData);
    } else {
      setData([...data, newEntry]);
    }
    handleClose();
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData({
      ...data[index],
      date: dayjs(data[index].date)
    });
    setOpen(true);
  };

  const handleDelete = (index) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  return (
    <Box sx={{ 
      height: '100vh',
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
                  {sortAndFilterData(data).map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{dayjs(row.date).format('MM/DD/YYYY')}</TableCell>
                      <TableCell>{row.organizer}</TableCell>
                      <TableCell>{row.organizee}</TableCell>
                      <TableCell>{row.event}</TableCell>
                      <TableCell>{row.leadership}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(index)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(index)} size="small">
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
                {viewMode === 'force' ? 'Network Visualization' : 'Leadership Flow'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search visualization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ width: 200 }}
                />
                <Button
                  variant={viewMode === 'force' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('force')}
                >
                  Network View
                </Button>
                <Button
                  variant={viewMode === 'sankey' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('sankey')}
                >
                  Flow View
                </Button>
              </Box>
            </Box>
            <Box sx={{ flex: 1, position: 'relative' }}>
              {viewMode === 'force' ? (
                <ForceGraph data={data} searchTerm={searchTerm} />
              ) : (
                <SankeyDiagram data={data} searchTerm={searchTerm} />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
            options={[...new Set(data.map(item => item.organizer))].filter(Boolean)}
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
            options={[...new Set(data.map(item => item.organizee))].filter(Boolean)}
            value={formData.organizee || ''}
            onInputChange={(event, newValue) => {
              setFormData({ ...formData, organizee: newValue || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Organizee" fullWidth variant="outlined" />
            )}
            getOptionLabel={(option) => option?.toString() || ''}
          />
          <TextField
            margin="dense"
            name="event"
            label="Event"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.event}
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
          <Button onClick={handleSubmit}>
            {editIndex !== null ? 'Save' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
