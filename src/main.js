const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const connector = require('./connector');

const store = new Store();
let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'ScaleHouse Connector - OpenDental',
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Configuration',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Status',
      click: () => {
        const status = connector.getStatus();
        dialog.showMessageBox({
          type: 'info',
          title: 'Connector Status',
          message: `Status: ${status.isRunning ? 'Running' : 'Stopped'}\n` +
                   `Last Sync: ${status.lastSync || 'Never'}\n` +
                   `Total Events: ${status.totalEvents || 0}\n` +
                   `Errors: ${status.errors || 0}`
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Start Sync',
      click: () => {
        connector.start();
      }
    },
    {
      label: 'Stop Sync',
      click: () => {
        connector.stop();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('ScaleHouse Connector - OpenDental');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Auto-start if configured
  const config = store.get('config');
  if (config && config.autoStart && config.apiKey && config.dbHost) {
    connector.start();
  }
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
  connector.stop();
});

// IPC handlers for renderer process
ipcMain.handle('get-config', async () => {
  return store.get('config', {});
});

ipcMain.handle('save-config', async (event, config) => {
  store.set('config', config);
  return { success: true };
});

ipcMain.handle('test-db-connection', async (event, config) => {
  try {
    const result = await connector.testConnection(config);
    return { success: true, message: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('test-api-connection', async (event, config) => {
  try {
    const result = await connector.testAPIConnection(config);
    return { success: true, message: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('start-connector', async () => {
  try {
    const config = store.get('config');
    if (!config || !config.apiKey || !config.dbHost) {
      return { success: false, message: 'Configuration incomplete' };
    }
    await connector.start();
    return { success: true, message: 'Connector started successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-connector', async () => {
  try {
    connector.stop();
    return { success: true, message: 'Connector stopped successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-status', async () => {
  return connector.getStatus();
});

// Send status updates to renderer
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status-update', connector.getStatus());
  }
}, 2000);
