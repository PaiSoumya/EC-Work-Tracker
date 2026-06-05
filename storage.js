// File-based storage handler for Work Tracker
// This allows sharing the dashboard without sharing personal data

const DATA_FILE = 'data.json';

// Global data cache
let dataCache = null;

// Load data from file
async function loadData() {
    try {
        const response = await fetch(DATA_FILE);
        if (!response.ok) {
            // If file doesn't exist or can't be read, return default structure
            console.log('Data file not found, using default empty data');
            return {
                projects: [],
                entries: [],
                claimedHours: {},
                mondayConfig: {
                    apiToken: '',
                    boardId: ''
                }
            };
        }
        const data = await response.json();
        dataCache = data;
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        // Return default structure on error
        return {
            projects: [],
            entries: [],
            claimedHours: {},
            mondayConfig: {
                apiToken: '',
                boardId: ''
            }
        };
    }
}

// Save data to file
async function saveData(data) {
    try {
        dataCache = data;
        
        // Create a downloadable file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = DATA_FILE;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Data saved successfully. Please replace the data.json file with the downloaded file.');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Get projects
async function getProjects() {
    const data = dataCache || await loadData();
    return data.projects || [];
}

// Save projects
async function saveProjects(projects) {
    const data = dataCache || await loadData();
    data.projects = projects;
    await saveData(data);
}

// Get entries
async function getEntries() {
    const data = dataCache || await loadData();
    return data.entries || [];
}

// Save entries
async function saveEntries(entries) {
    const data = dataCache || await loadData();
    data.entries = entries;
    await saveData(data);
}

// Get claimed hours
async function getClaimedHours() {
    const data = dataCache || await loadData();
    return data.claimedHours || {};
}

// Save claimed hours
async function saveClaimedHours(claimedHours) {
    const data = dataCache || await loadData();
    data.claimedHours = claimedHours;
    await saveData(data);
}

// Get Monday.com config
async function getMondayConfig() {
    const data = dataCache || await loadData();
    return data.mondayConfig || { apiToken: '', boardId: '' };
}

// Save Monday.com config
async function saveMondayConfig(config) {
    const data = dataCache || await loadData();
    data.mondayConfig = config;
    await saveData(data);
}

// Made with Bob
