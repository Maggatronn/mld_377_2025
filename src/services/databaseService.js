// Local storage keys
const STORAGE_KEY = 'network_data';

// Helper function to get data from localStorage
const getStoredData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Helper function to save data to localStorage
const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const fetchRecords = async () => {
  try {
    const records = getStoredData();
    return records;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
};

export const createRecord = async (data) => {
  try {
    const records = getStoredData();
    const id = Math.random().toString(36).substr(2, 9);
    const newRecord = {
      id,
      ...data,
      date: data.date.format('YYYY-MM-DD')
    };
    
    records.push(newRecord);
    saveData(records);
    
    return newRecord;
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

export const updateRecord = async (id, data) => {
  try {
    const records = getStoredData();
    const index = records.findIndex(record => record.id === id);
    
    if (index !== -1) {
      records[index] = {
        id,
        ...data,
        date: data.date.format('YYYY-MM-DD')
      };
      saveData(records);
      return records[index];
    }
    
    throw new Error('Record not found');
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

export const deleteRecord = async (id) => {
  try {
    const records = getStoredData();
    const filteredRecords = records.filter(record => record.id !== id);
    saveData(filteredRecords);
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}; 