const mysql = require('mysql2/promise');
const API = require('./api');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

const DEFAULT_SYNC_START_DATE = '2020-01-01';

class Connector {
  constructor(config) {
    this.config = config;
    this.api = new API(config.apiEndpoint, config.apiKey);
    this.connection = null;
    this.pollInterval = null;
    this.lastSyncTime = null;
    this.isRunning = false;
    this.logPath = path.join(app.getPath('userData'), 'logs', 'connector.log');
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    await this.log('Connector starting...');

    try {
      // Test database connection
      await this.connectDB();
      await this.log('Database connection established');

      // Test API connection
      await this.api.testConnection();
      await this.log('API connection verified');

      // Load last sync time
      await this.loadLastSyncTime();

      // Start polling
      this.startPolling();

      this.config.onStatusChange('syncing');
    } catch (error) {
      await this.log(`Error starting connector: ${error.message}`);
      this.config.onStatusChange('error');
      this.isRunning = false;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    await this.log('Connector stopping...');
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.connection) {
      this.connection.end();
      this.connection = null;
    }

    this.isRunning = false;
    this.config.onStatusChange('disconnected');
  }

  async connectDB() {
    const { host, port, user, password, database } = this.config.dbConfig;
    
    this.connection = await mysql.createConnection({
      host,
      port: port || 3306,
      user,
      password,
      database: database || 'opendental'
    });
  }

  startPolling() {
    // Poll every 5 minutes
    const pollIntervalMs = 5 * 60 * 1000;
    
    // Do initial sync
    this.syncAuditEvents();

    this.pollInterval = setInterval(() => {
      this.syncAuditEvents();
    }, pollIntervalMs);
  }

  async syncAuditEvents() {
    try {
      await this.log('Syncing audit events...');

      // Query for new audit events since last sync
      const query = `
        SELECT 
          SecurityLogNum,
          PermType,
          UserNum,
          FKey,
          LogText,
          CompName,
          DateTStamp
        FROM securitylog
        WHERE DateTStamp > ?
        ORDER BY DateTStamp ASC
        LIMIT 1000
      `;

      const [rows] = await this.connection.execute(query, [
        this.lastSyncTime || new Date(DEFAULT_SYNC_START_DATE)
      ]);

      if (rows.length === 0) {
        await this.log('No new events to sync');
        return;
      }

      await this.log(`Found ${rows.length} new events`);

      // Send events to API in batches
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await this.api.sendAuditEvents(batch);
      }

      // Update last sync time
      this.lastSyncTime = rows[rows.length - 1].DateTStamp;
      await this.saveLastSyncTime();

      await this.log(`Successfully synced ${rows.length} events`);
    } catch (error) {
      await this.log(`Error syncing events: ${error.message}`);
      
      // Try to reconnect on database error
      if (error.code && error.code.startsWith('ER_')) {
        await this.log('Database connection lost, attempting to reconnect...');
        try {
          await this.connectDB();
          await this.log('Reconnected to database');
        } catch (reconnectError) {
          await this.log(`Reconnection failed: ${reconnectError.message}`);
          this.config.onStatusChange('error');
        }
      }
    }
  }

  async loadLastSyncTime() {
    try {
      const syncFilePath = path.join(app.getPath('userData'), 'last-sync.txt');
      const content = await fs.readFile(syncFilePath, 'utf8');
      this.lastSyncTime = new Date(content.trim());
      await this.log(`Last sync time loaded: ${this.lastSyncTime.toISOString()}`);
    } catch (error) {
      // File doesn't exist, start from beginning
      this.lastSyncTime = new Date(DEFAULT_SYNC_START_DATE);
      await this.log(`No previous sync time found, starting from ${DEFAULT_SYNC_START_DATE}`);
    }
  }

  async saveLastSyncTime() {
    try {
      const syncFilePath = path.join(app.getPath('userData'), 'last-sync.txt');
      await fs.writeFile(syncFilePath, this.lastSyncTime.toISOString());
    } catch (error) {
      await this.log(`Error saving sync time: ${error.message}`);
    }
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(logMessage.trim());

    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logPath);
      await fs.mkdir(logDir, { recursive: true });
      
      // Append to log file
      await fs.appendFile(this.logPath, logMessage);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

module.exports = Connector;
