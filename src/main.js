/**
 * ScaleHouse Connector - Electron Main Process
 * 
 * Windows desktop application that syncs OpenDental audit events
 * to the ScaleHouse compliance platform.
 * 
 * This application:
 * 1. Runs in the Windows system tray
 * 2. Polls the OpenDental MySQL database for audit events
 * 3. Sends audit data to ScaleHouse API
 * 4. NEVER accesses or transmits PHI (Protected Health Information)
 */

const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const OpenDentalConnector = require('./connector');
const ScaleHouseAPI = require('./api');

// Persistent settings storage
const store = new Store();

// Global references
let tray = null;
let mainWindow = null;
let connector = null;
let api = null;
let syncInterval = null;

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('🚀 ScaleHouse Connector starting...');
  
  // Load configuration
  const config = {
    dbHost: store.get('dbHost'),
    dbPort: store.get('dbPort', 3306),
    dbUser: store.get('dbUser'),
    dbPassword: store.get('dbPassword'),
    dbName: store.get('dbName', 'opendental'),
    apiKey: store.get('apiKey'),
    apiUrl: store.get('apiUrl', 'https://api.scalehousesystems.com'),
    syncInterval: store.get('syncInterval', 300000) // 5 minutes default
  };

  // Check if configured
  if (!config.apiKey || !config.dbHost || !config.dbUser || !config.dbPassword) {
    console.log('⚙️ First-time setup required');
    createConfigWindow();
    return;
  }

  // Initialize connectors
  connector = new OpenDentalConnector(config);
  api = new ScaleHouseAPI(config.apiKey, config.apiUrl);

  // Start syncing
  startSync(config.syncInterval);
  
  console.log('✅ ScaleHouse Connector initialized');
}

/**
 * Create configuration window for first-time setup
 */
function createConfigWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../build/icon.ico')
  });

  // For now, open activation page in browser
  // In production, this would be a proper Electron form
  const activationUrl = store.get('apiUrl', 'https://scalehousesystems.com') + '/activate';
  require('electron').shell.openExternal(activationUrl);
  
  mainWindow.loadURL(`data:text/html,
    <html>
      <head>
        <title>ScaleHouse Connector - Setup</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #333; margin-top: 0; }
          p { color: #666; line-height: 1.6; }
          .info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 ScaleHouse Connector Setup</h1>
          <p>Welcome! This connector syncs OpenDental audit events to ScaleHouse.</p>
          
          <div class="info">
            <strong>✅ PHI Protection Guarantee</strong><br>
            This connector ONLY accesses audit logs and metadata.<br>
            It NEVER reads or transmits patient medical records or personal information.
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>A browser window will open to the activation page</li>
            <li>Log in to your ScaleHouse account</li>
            <li>Enter your OpenDental database credentials</li>
            <li>The connector will save settings and start syncing</li>
          </ol>
          
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            You can close this window once setup is complete.
          </p>
        </div>
      </body>
    </html>
  `);
}

/**
 * Start the sync process
 */
async function startSync(intervalMs) {
  console.log(`⏰ Starting sync every ${intervalMs / 1000} seconds`);
  
  // Verify connections first
  try {
    await connector.connect();
    const dbStatus = await connector.verifyConnection();
    console.log('📊 Database status:', dbStatus.status);
    
    await api.verifyConnection();
    console.log('🌐 API connection verified');
  } catch (error) {
    console.error('❌ Connection verification failed:', error.message);
    showNotification('Connection Error', error.message);
    return;
  }

  // Perform initial sync
  await performSync();

  // Schedule periodic syncs
  syncInterval = setInterval(performSync, intervalMs);
  
  // Send heartbeat every minute
  setInterval(() => {
    if (api) api.sendHeartbeat();
  }, 60000);
}

/**
 * Perform a single sync operation
 */
async function performSync() {
  try {
    console.log('🔄 Starting sync...');
    
    // Get audit data from OpenDental
    const auditData = await connector.syncAuditData();
    
    // Send to ScaleHouse API
    if (auditData && Object.values(auditData.data).some(arr => arr.length > 0)) {
      await api.sendAuditData(auditData);
    } else {
      console.log('ℹ️ No new audit data to sync');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    showNotification('Sync Error', error.message);
  }
}

/**
 * Create system tray icon and menu
 */
function createTray() {
  // Create tray icon (using a simple 16x16 image)
  const iconPath = path.join(__dirname, '../build/icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ScaleHouse Connector',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Sync Now',
      click: () => {
        performSync();
      }
    },
    {
      label: 'Status',
      click: () => {
        showStatus();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        createConfigWindow();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('ScaleHouse Connector - Running');
  tray.setContextMenu(contextMenu);
}

/**
 * Show status information
 */
function showStatus() {
  const status = {
    connected: connector && connector.connection ? 'Connected' : 'Disconnected',
    lastSync: connector ? connector.lastSyncTime : null,
    database: store.get('dbHost'),
    api: store.get('apiUrl')
  };
  
  console.log('📊 Status:', status);
  
  // Show notification with status
  showNotification('ScaleHouse Connector Status', 
    `Database: ${status.connected}\n` +
    `Last Sync: ${status.lastSync ? status.lastSync.toLocaleString() : 'Never'}`
  );
}

/**
 * Show system notification
 */
function showNotification(title, message) {
  // Electron notifications would go here
  // For now, just log
  console.log(`[NOTIFICATION] ${title}: ${message}`);
}

/**
 * Application lifecycle events
 */
app.whenReady().then(() => {
  createTray();
  initializeApp();
});

app.on('window-all-closed', (e) => {
  // Don't quit when all windows are closed (run in background)
  e.preventDefault();
});

app.on('before-quit', async () => {
  // Clean up
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  if (connector) {
    await connector.disconnect();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
