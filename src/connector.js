/**
 * OpenDental MySQL Database Connector
 * 
 * This module connects to the OpenDental MySQL database and queries
 * specific tables for audit and compliance tracking.
 * 
 * PHI PROTECTION: This connector NEVER queries or exposes Protected Health Information (PHI).
 * It only accesses audit logs, security logs, and metadata tables.
 */

const mysql = require('mysql2/promise');

class OpenDentalConnector {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.lastSyncTime = null;
  }

  /**
   * Establish connection to OpenDental MySQL database
   */
  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.dbHost,
        user: this.config.dbUser,
        password: this.config.dbPassword,
        database: this.config.dbName || 'opendental',
        port: this.config.dbPort || 3306,
      });
      console.log('✅ Connected to OpenDental database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Disconnected from OpenDental database');
    }
  }

  /**
   * Get security log entries (audit trail)
   * 
   * NO PHI: This table contains only user actions, timestamps, and system events.
   * It does NOT contain patient medical records or personal information.
   * 
   * @param {Date} since - Get logs since this timestamp
   * @returns {Array} Security log entries
   */
  async getSecurityLogs(since) {
    const query = `
      SELECT 
        SecurityLogNum,
        PermType,
        UserNum,
        LogDateTime,
        LogText,
        CompName,
        FKey,
        FKeyType,
        DefNum,
        DefNumError
      FROM securitylog
      WHERE LogDateTime > ?
      ORDER BY LogDateTime ASC
      LIMIT 1000
    `;
    
    const [rows] = await this.connection.execute(query, [since]);
    return rows;
  }

  /**
   * Get appointment changes (for compliance tracking)
   * 
   * NO PHI: Only retrieves appointment metadata like status changes and timestamps.
   * Patient names, medical conditions, and treatment details are EXCLUDED.
   * 
   * @param {Date} since - Get changes since this timestamp
   * @returns {Array} Appointment change records
   */
  async getAppointmentChanges(since) {
    const query = `
      SELECT 
        AptNum,
        AptStatus,
        AptDateTime,
        Op,
        ProvNum,
        ProvHyg,
        DateTStamp,
        ClinicNum,
        SecUserNumEntry
      FROM appointment
      WHERE DateTStamp > ?
      ORDER BY DateTStamp ASC
      LIMIT 1000
    `;
    
    const [rows] = await this.connection.execute(query, [since]);
    return rows;
  }

  /**
   * Get user login attempts
   * 
   * NO PHI: Only tracks login security events.
   * 
   * @param {Date} since - Get attempts since this timestamp
   * @returns {Array} Login attempt records
   */
  async getLoginAttempts(since) {
    const query = `
      SELECT 
        LoginAttemptNum,
        UserName,
        AttemptDateTime,
        LoginType
      FROM loginattempt
      WHERE AttemptDateTime > ?
      ORDER BY AttemptDateTime ASC
      LIMIT 1000
    `;
    
    const [rows] = await this.connection.execute(query, [since]);
    return rows;
  }

  /**
   * Get electronic service logs
   * 
   * NO PHI: Only system integration logs.
   * 
   * @param {Date} since - Get logs since this timestamp
   * @returns {Array} Service log entries
   */
  async getEServiceLogs(since) {
    const query = `
      SELECT 
        EServiceLogNum,
        ServiceType,
        LogDateTime,
        Severity
      FROM eservicelog
      WHERE LogDateTime > ?
      ORDER BY LogDateTime ASC
      LIMIT 1000
    `;
    
    const [rows] = await this.connection.execute(query, [since]);
    return rows;
  }

  /**
   * Get security log hash records (for integrity verification)
   * 
   * NO PHI: Only cryptographic hashes for audit trail integrity.
   * 
   * @param {Date} since - Get hashes since this timestamp
   * @returns {Array} Security log hash records
   */
  async getSecurityLogHashes(since) {
    const query = `
      SELECT 
        SecurityLogHashNum,
        LogHash,
        DateTSecurityLog
      FROM securityloghash
      WHERE DateTSecurityLog > ?
      ORDER BY DateTSecurityLog ASC
      LIMIT 1000
    `;
    
    const [rows] = await this.connection.execute(query, [since]);
    return rows;
  }

  /**
   * Sync all audit data since last sync
   * 
   * This is the main function called by the polling mechanism.
   * It retrieves all audit-related data without touching PHI.
   * 
   * @returns {Object} All audit data collected
   */
  async syncAuditData() {
    if (!this.connection) {
      await this.connect();
    }

    // Use last sync time or default to 24 hours ago
    const since = this.lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`📊 Syncing audit data since ${since.toISOString()}`);

    const auditData = {
      timestamp: new Date(),
      since: since,
      data: {
        securityLogs: await this.getSecurityLogs(since),
        appointmentChanges: await this.getAppointmentChanges(since),
        loginAttempts: await this.getLoginAttempts(since),
        eserviceLogs: await this.getEServiceLogs(since),
        securityLogHashes: await this.getSecurityLogHashes(since),
      }
    };

    // Update last sync time
    this.lastSyncTime = new Date();

    console.log(`✅ Synced ${Object.values(auditData.data).reduce((sum, arr) => sum + arr.length, 0)} records`);
    
    return auditData;
  }

  /**
   * Verify database connection and table access
   * 
   * This function checks that we can connect to the database and
   * that the required tables exist.
   * 
   * @returns {Object} Connection status and available tables
   */
  async verifyConnection() {
    if (!this.connection) {
      await this.connect();
    }

    // Check that required audit tables exist
    const requiredTables = [
      'securitylog',
      'appointment',
      'loginattempt',
      'eservicelog',
      'securityloghash'
    ];

    const [tables] = await this.connection.execute(
      'SHOW TABLES LIKE ?',
      ['%']
    );

    const availableTables = tables.map(row => Object.values(row)[0]);
    const missingTables = requiredTables.filter(
      table => !availableTables.includes(table)
    );

    return {
      connected: true,
      requiredTables,
      availableTables: availableTables.length,
      missingTables,
      status: missingTables.length === 0 ? 'ready' : 'missing_tables'
    };
  }

  /**
   * Test database query (for diagnostics)
   * 
   * Returns a count of security log entries to verify database access.
   * 
   * @returns {Object} Test results
   */
  async testQuery() {
    if (!this.connection) {
      await this.connect();
    }

    const [result] = await this.connection.execute(
      'SELECT COUNT(*) as count FROM securitylog'
    );

    return {
      success: true,
      securityLogCount: result[0].count,
      timestamp: new Date()
    };
  }
}

module.exports = OpenDentalConnector;
