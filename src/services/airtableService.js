// Use local storage as a simple database
const STORAGE_KEY = 'network_data';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initialize storage if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

export const fetchRecords = async () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return data;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
};

export const createRecord = async (data) => {
  try {
    const records = await fetchRecords();
    const newRecord = {
      id: generateId(),
      ...data,
      date: data.date.format('YYYY-MM-DD') // Format date for storage
    };
    records.push(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

export const updateRecord = async (id, data) => {
  try {
    const records = await fetchRecords();
    const index = records.findIndex(record => record.id === id);
    if (index === -1) throw new Error('Record not found');
    
    const updatedRecord = {
      ...records[index],
      ...data,
      id,
      date: data.date.format('YYYY-MM-DD') // Format date for storage
    };
    records[index] = updatedRecord;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return updatedRecord;
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

export const deleteRecord = async (id) => {
  try {
    const records = await fetchRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}; 