const mysql = require('mysql2/promise');
const Store = require('electron-store');
const api = require('./api');

const store = new Store();

class OpenDentalConnector {
  constructor() {
    this.connection = null;
    this.isRunning = false;
    this.pollInterval = null;
    this.lastSync = null;
    this.totalEvents = 0;
    this.errors = 0;
    this.lastError = null;
  }

  async testConnection(config) {
    const testConnection = await mysql.createConnection({
      host: config.dbHost,
      port: config.dbPort || 3306,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbDatabase || 'opendental',
      connectTimeout: 10000
    });

    try {
      // Test basic connection
      await testConnection.ping();

      // Verify we can query the audit view
      const viewName = config.auditView || 'audit_log_view';
      const [rows] = await testConnection.query(
        `SELECT COUNT(*) as count FROM ${mysql.escapeId(viewName)} LIMIT 1`
      );

      await testConnection.end();
      return `Connection successful! View "${viewName}" accessible with ${rows[0].count} records.`;
    } catch (error) {
      await testConnection.end();
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async testAPIConnection(config) {
    try {
      const result = await api.testConnection(config.apiKey, config.apiEndpoint);
      return result;
    } catch (error) {
      throw new Error(`API connection failed: ${error.message}`);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Connector already running');
      return;
    }

    const config = store.get('config');
    if (!config || !config.apiKey || !config.dbHost) {
      throw new Error('Configuration incomplete. Please configure the connector first.');
    }

    try {
      // Create connection pool with limited permissions
      this.connection = await mysql.createPool({
        host: config.dbHost,
        port: config.dbPort || 3306,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbDatabase || 'opendental',
        waitForConnections: true,
        connectionLimit: 2, // Minimal connections needed
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test the connection
      await this.connection.query('SELECT 1');

      this.isRunning = true;
      console.log('Connector started successfully');

      // Start polling
      this.pollInterval = setInterval(async () => {
        await this.pollAuditLog();
      }, (config.pollIntervalSeconds || 60) * 1000);

      // Initial poll
      await this.pollAuditLog();
    } catch (error) {
      this.errors++;
      this.lastError = error.message;
      console.error('Failed to start connector:', error);
      throw error;
    }
  }

  stop() {
    if (!this.isRunning) {
      console.log('Connector not running');
      return;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.connection) {
      this.connection.end();
      this.connection = null;
    }

    this.isRunning = false;
    console.log('Connector stopped');
  }

  async pollAuditLog() {
    if (!this.connection) return;

    const config = store.get('config');
    const viewName = config.auditView || 'audit_log_view';
    const lastSyncId = store.get('lastSyncId', 0);

    try {
      // Query only the audit view with SELECT permission
      // This enforces least-privilege access - MySQL will reject queries to PHI tables
      const query = `
        SELECT 
          AuditLogNum,
          PatNum,
          UserNum,
          LogDateTime,
          LogText,
          PermType
        FROM ${mysql.escapeId(viewName)}
        WHERE AuditLogNum > ?
        ORDER BY AuditLogNum ASC
        LIMIT ?
      `;

      const [rows] = await this.connection.query(query, [
        lastSyncId,
        config.batchSize || 100
      ]);

      if (rows.length > 0) {
        console.log(`Found ${rows.length} new audit events`);

        // Send events to ScaleHouse API
        const result = await api.sendAuditEvents(
          config.apiKey,
          config.apiEndpoint,
          rows
        );

        if (result.success) {
          // Update last sync ID
          const lastId = rows[rows.length - 1].AuditLogNum;
          store.set('lastSyncId', lastId);
          this.totalEvents += rows.length;
          this.lastSync = new Date().toISOString();
          console.log(`Successfully synced ${rows.length} events. Last ID: ${lastId}`);
        } else {
          throw new Error(result.error || 'Failed to send events to API');
        }
      } else {
        // Update last sync time even if no new events
        this.lastSync = new Date().toISOString();
      }
    } catch (error) {
      this.errors++;
      this.lastError = error.message;
      console.error('Error polling audit log:', error);

      // Check if it's a permission error
      if (error.message.includes('denied') || error.message.includes('SELECT')) {
        console.error('⚠️  Permission error detected. This user may not have SELECT access to the view.');
        console.error('   Ensure MySQL user has SELECT-only permissions scoped to the audit view.');
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      totalEvents: this.totalEvents,
      errors: this.errors,
      lastError: this.lastError,
      connectionStatus: this.connection ? 'Connected' : 'Disconnected'
    };
  }
}

// Export singleton instance
const connector = new OpenDentalConnector();
module.exports = connector;
