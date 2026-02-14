const { ipcRenderer } = require('electron');

// Load configuration on startup
window.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  updateStatus();
});

// Listen for status updates
ipcRenderer.on('status-update', (event, status) => {
  updateStatusDisplay(status);
});

async function loadConfig() {
  try {
    const config = await ipcRenderer.invoke('get-config');
    
    if (config) {
      document.getElementById('dbHost').value = config.dbHost || '';
      document.getElementById('dbPort').value = config.dbPort || '3306';
      document.getElementById('dbUser').value = config.dbUser || '';
      document.getElementById('dbPassword').value = config.dbPassword || '';
      document.getElementById('dbDatabase').value = config.dbDatabase || 'opendental';
      document.getElementById('auditView').value = config.auditView || 'audit_log_view';
      document.getElementById('apiKey').value = config.apiKey || '';
      document.getElementById('apiEndpoint').value = config.apiEndpoint || 'https://api.scalehousesystems.com';
      document.getElementById('pollIntervalSeconds').value = config.pollIntervalSeconds || '60';
      document.getElementById('batchSize').value = config.batchSize || '100';
      document.getElementById('autoStart').checked = config.autoStart || false;
    }

    showMessage('Configuration loaded', 'success');
  } catch (error) {
    showMessage(`Error loading configuration: ${error.message}`, 'error');
  }
}

async function saveConfig() {
  const config = {
    dbHost: document.getElementById('dbHost').value,
    dbPort: parseInt(document.getElementById('dbPort').value) || 3306,
    dbUser: document.getElementById('dbUser').value,
    dbPassword: document.getElementById('dbPassword').value,
    dbDatabase: document.getElementById('dbDatabase').value || 'opendental',
    auditView: document.getElementById('auditView').value || 'audit_log_view',
    apiKey: document.getElementById('apiKey').value,
    apiEndpoint: document.getElementById('apiEndpoint').value || 'https://api.scalehousesystems.com',
    pollIntervalSeconds: parseInt(document.getElementById('pollIntervalSeconds').value) || 60,
    batchSize: parseInt(document.getElementById('batchSize').value) || 100,
    autoStart: document.getElementById('autoStart').checked
  };

  try {
    const result = await ipcRenderer.invoke('save-config', config);
    if (result.success) {
      showMessage('Configuration saved successfully!', 'success');
    } else {
      showMessage('Failed to save configuration', 'error');
    }
  } catch (error) {
    showMessage(`Error saving configuration: ${error.message}`, 'error');
  }
}

async function testDB() {
  const config = {
    dbHost: document.getElementById('dbHost').value,
    dbPort: parseInt(document.getElementById('dbPort').value) || 3306,
    dbUser: document.getElementById('dbUser').value,
    dbPassword: document.getElementById('dbPassword').value,
    dbDatabase: document.getElementById('dbDatabase').value || 'opendental',
    auditView: document.getElementById('auditView').value || 'audit_log_view'
  };

  if (!config.dbHost || !config.dbUser || !config.dbPassword) {
    showMessage('Please fill in database host, user, and password', 'error');
    return;
  }

  showMessage('Testing database connection...', 'success');

  try {
    const result = await ipcRenderer.invoke('test-db-connection', config);
    if (result.success) {
      showMessage(`✅ ${result.message}`, 'success');
    } else {
      showMessage(`❌ ${result.message}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Test failed: ${error.message}`, 'error');
  }
}

async function testAPI() {
  const config = {
    apiKey: document.getElementById('apiKey').value,
    apiEndpoint: document.getElementById('apiEndpoint').value || 'https://api.scalehousesystems.com'
  };

  if (!config.apiKey) {
    showMessage('Please enter API key', 'error');
    return;
  }

  showMessage('Testing API connection...', 'success');

  try {
    const result = await ipcRenderer.invoke('test-api-connection', config);
    if (result.success) {
      showMessage(`✅ ${result.message}`, 'success');
    } else {
      showMessage(`❌ ${result.message}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Test failed: ${error.message}`, 'error');
  }
}

async function startConnector() {
  try {
    const result = await ipcRenderer.invoke('start-connector');
    if (result.success) {
      showMessage('✅ Connector started successfully!', 'success');
      updateStatus();
    } else {
      showMessage(`❌ Failed to start: ${result.message}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

async function stopConnector() {
  try {
    const result = await ipcRenderer.invoke('stop-connector');
    if (result.success) {
      showMessage('⏹️ Connector stopped', 'success');
      updateStatus();
    } else {
      showMessage(`❌ Failed to stop: ${result.message}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

async function updateStatus() {
  try {
    const status = await ipcRenderer.invoke('get-status');
    updateStatusDisplay(status);
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

function updateStatusDisplay(status) {
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');
  const lastSyncText = document.getElementById('lastSyncText');
  const totalEventsText = document.getElementById('totalEventsText');
  const errorsText = document.getElementById('errorsText');

  if (status.isRunning) {
    statusBar.className = 'status-bar running';
    statusText.textContent = '✅ Running';
  } else {
    statusBar.className = 'status-bar stopped';
    statusText.textContent = '⏹️ Stopped';
  }

  if (status.lastSync) {
    const lastSyncDate = new Date(status.lastSync);
    lastSyncText.textContent = lastSyncDate.toLocaleString();
  } else {
    lastSyncText.textContent = 'Never';
  }

  totalEventsText.textContent = status.totalEvents || 0;
  errorsText.textContent = status.errors || 0;

  if (status.lastError) {
    console.error('Last error:', status.lastError);
  }
}

function showMessage(message, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = message;
  messageEl.className = `message ${type} show`;

  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 5000);
}

// Form submission
document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveConfig();
});

// Auto-update status every 2 seconds
setInterval(updateStatus, 2000);
