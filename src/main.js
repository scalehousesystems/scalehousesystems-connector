const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const Connector = require('./connector');

const store = new Store();
let tray = null;
let mainWindow = null;
let connector = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createTray();
  
  // Check if configured
  const apiKey = store.get('apiKey');
  const apiEndpoint = store.get('apiEndpoint');
  const dbConfig = store.get('dbConfig');
  
  if (!apiKey || !apiEndpoint || !dbConfig) {
    // First run - open configuration page
    openConfigPage();
  } else {
    // Start connector
    startConnector();
  }
});

app.on('window-all-closed', (e) => {
  // Keep app running in system tray
  e.preventDefault();
});

function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  tray = new Tray(iconPath);
  
  updateTrayMenu('disconnected');
  
  tray.setToolTip('ScaleHouse Connector');
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      openConfigPage();
    }
  });
}

function updateTrayMenu(status) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Status: ${status}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Configure',
      click: openConfigPage
    },
    {
      label: 'Start Sync',
      enabled: status !== 'syncing',
      click: startConnector
    },
    {
      label: 'Stop Sync',
      enabled: status === 'syncing',
      click: stopConnector
    },
    { type: 'separator' },
    {
      label: 'View Logs',
      click: openLogs
    },
    {
      label: 'Quit',
      click: () => {
        if (connector) {
          connector.stop();
        }
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function openConfigPage() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }
  
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../build/icon.ico')
  });
  
  // Open ScaleHouse activation page
  const apiEndpoint = store.get('apiEndpoint') || 'https://app.scalehousesystems.com';
  mainWindow.loadURL(`${apiEndpoint}/connector/activate`);
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startConnector() {
  const apiKey = store.get('apiKey');
  const apiEndpoint = store.get('apiEndpoint');
  const dbConfig = store.get('dbConfig');
  
  if (!apiKey || !apiEndpoint || !dbConfig) {
    openConfigPage();
    return;
  }
  
  if (connector) {
    connector.stop();
  }
  
  connector = new Connector({
    apiKey,
    apiEndpoint,
    dbConfig,
    onStatusChange: (status) => {
      updateTrayMenu(status);
      if (status === 'error') {
        tray.displayBalloon({
          title: 'ScaleHouse Connector',
          content: 'Connection error. Please check configuration.'
        });
      }
    }
  });
  
  connector.start();
  updateTrayMenu('syncing');
}

function stopConnector() {
  if (connector) {
    connector.stop();
    updateTrayMenu('disconnected');
  }
}

function openLogs() {
  const logPath = path.join(app.getPath('userData'), 'logs');
  shell.openPath(logPath);
}

// Handle IPC messages from renderer process (if needed in future)
const { ipcMain } = require('electron');

ipcMain.on('save-config', (event, config) => {
  store.set('apiKey', config.apiKey);
  store.set('apiEndpoint', config.apiEndpoint);
  store.set('dbConfig', config.dbConfig);
  
  event.reply('config-saved');
  startConnector();
});

ipcMain.on('get-config', (event) => {
  event.reply('config-data', {
    apiKey: store.get('apiKey'),
    apiEndpoint: store.get('apiEndpoint'),
    dbConfig: store.get('dbConfig')
  });
});
