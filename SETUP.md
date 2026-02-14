# OpenDental MySQL Connector Setup Guide

## 🔒 Security-First MySQL Configuration

This connector uses **SELECT-only permissions** on a dedicated MySQL user account. Access is restricted to the audit view and non-PHI reference tables only. The database enforces least-privilege access control.

### Step 1: Create the Audit View

The connector queries a **view** instead of direct tables. This view should be created by your DBA to expose only the audit log fields needed for compliance tracking.

```sql
-- Example audit view (adjust based on your OpenDental schema)
CREATE OR REPLACE VIEW audit_log_view AS
SELECT 
    securitylog.SecurityLogNum AS AuditLogNum,
    securitylog.PatNum,
    securitylog.UserNum,
    securitylog.LogDateTime,
    securitylog.LogText,
    securitylog.PermType
FROM securitylog
WHERE securitylog.SecurityLogNum > 0
ORDER BY securitylog.SecurityLogNum;
```

**Important:** This view should NOT include PHI (Protected Health Information) fields beyond the PatNum identifier. All patient names, SSNs, addresses, etc. should be excluded.

### Step 2: Create the Dedicated MySQL User

Create a MySQL user specifically for the connector with **SELECT-only** permissions:

```sql
-- Create the user (use a strong password)
CREATE USER 'scalehouse_reader'@'localhost' 
IDENTIFIED BY 'your_secure_password_here';

-- Grant SELECT permission ONLY on the audit view
GRANT SELECT ON opendental.audit_log_view 
TO 'scalehouse_reader'@'localhost';

-- Optional: Grant SELECT on non-PHI reference tables if needed
-- GRANT SELECT ON opendental.userod TO 'scalehouse_reader'@'localhost';
-- GRANT SELECT ON opendental.permission TO 'scalehouse_reader'@'localhost';

-- Apply the privileges
FLUSH PRIVILEGES;
```

### Step 3: Verify Permissions

Test that the user has the correct permissions and **cannot** access PHI tables:

```sql
-- This should work:
SELECT COUNT(*) FROM opendental.audit_log_view;

-- These should FAIL (Access Denied):
SELECT * FROM opendental.patient;
SELECT * FROM opendental.appointment;
SELECT * FROM opendental.securitylog;
```

### Step 4: Test the Connection

Use the connector's "Test Database" button to verify:
1. Connection succeeds
2. The audit view is accessible
3. Record count is displayed

## 📋 Connector Configuration

### Database Settings

- **MySQL Host**: The hostname or IP of your OpenDental database server
  - If running on the same machine: `localhost`
  - If remote: `192.168.1.100` or `db.yourdomain.com`

- **MySQL Port**: Default is `3306`

- **MySQL User**: `scalehouse_reader` (the dedicated user created above)

- **MySQL Password**: The secure password for the dedicated user

- **Database Name**: `opendental` (or your OpenDental database name)

- **Audit View Name**: `audit_log_view` (or your custom view name)

### API Settings

- **ScaleHouse API Key**: Your unique API key from the ScaleHouse platform
- **API Endpoint**: `https://api.scalehousesystems.com` (default)

### Sync Settings

- **Poll Interval**: How often to check for new audit events (default: 60 seconds)
- **Batch Size**: Maximum events to sync per poll (default: 100)
- **Auto-start**: Whether to start syncing automatically on application launch

## 🚀 Installation & Usage

### Install the Connector

1. Download the MSI installer: `ScaleHouseConnector-latest.msi`
2. Right-click and "Run as Administrator"
3. Follow the installation wizard
4. The connector will appear in your system tray

### First-Time Setup

1. Double-click the connector icon in the system tray
2. Fill in the database configuration
3. Click "Test Database" to verify the connection
4. Fill in your ScaleHouse API key
5. Click "Test API" to verify the API connection
6. Click "Save Configuration"
7. Click "Start Sync" to begin syncing audit events

### System Tray Menu

- **Open Configuration**: Opens the configuration window
- **Status**: Shows current sync status and statistics
- **Start Sync**: Begins syncing audit events
- **Stop Sync**: Stops syncing
- **Quit**: Exits the connector (stops syncing and closes the app)

## 🔐 Security Best Practices

### Database Security

✅ **DO:**
- Create a dedicated MySQL user for the connector
- Grant ONLY SELECT permission on the audit view
- Use a strong, unique password
- Restrict access by host (e.g., `'user'@'localhost'` instead of `'user'@'%'`)
- Regularly rotate the password
- Monitor the audit logs for unusual access patterns

❌ **DON'T:**
- Grant INSERT, UPDATE, or DELETE permissions
- Grant access to PHI-containing tables
- Use a shared or admin MySQL account
- Store the password in plain text
- Use weak passwords

### Application Security

The connector stores configuration locally using electron-store, which encrypts sensitive data. However:

- Install only on trusted machines
- Run with standard user privileges (not admin) when possible
- Keep Windows updated with security patches
- Use Windows Firewall to restrict network access
- Monitor the connector logs for errors

### Network Security

- If the database is remote, use a VPN or encrypted tunnel
- Consider using MySQL SSL/TLS for database connections
- Restrict API endpoint access to authorized IP addresses (configure in ScaleHouse platform)
- Use HTTPS for all API communication (enabled by default)

## 🐛 Troubleshooting

### "Access Denied" Errors

**Problem:** MySQL user doesn't have the correct permissions

**Solution:**
1. Verify the user exists: `SELECT User, Host FROM mysql.user WHERE User = 'scalehouse_reader';`
2. Check permissions: `SHOW GRANTS FOR 'scalehouse_reader'@'localhost';`
3. Re-grant SELECT permission on the audit view
4. Run `FLUSH PRIVILEGES;`

### "Table/View Doesn't Exist" Errors

**Problem:** The audit view hasn't been created

**Solution:**
1. Verify the view exists: `SHOW FULL TABLES IN opendental WHERE TABLE_TYPE LIKE 'VIEW';`
2. Create the audit_log_view (see Step 1 above)
3. Verify the view name matches the configuration

### "Connection Timeout" Errors

**Problem:** Can't connect to the MySQL database

**Solution:**
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check if MySQL is listening on the expected port: `netstat -an | grep 3306`
3. Verify firewall rules allow connections to port 3306
4. Test connection with: `mysql -h localhost -u scalehouse_reader -p`

### "No Events Syncing" Issues

**Problem:** Connector is running but no events are being sent

**Solution:**
1. Check the "Last Sync" time in the status bar
2. Verify there are new events in the audit view
3. Check for errors in the connector logs
4. Verify API connectivity with "Test API" button
5. Ensure the API key is valid and active

### Connector Won't Start

**Problem:** Application fails to start or crashes immediately

**Solution:**
1. Check Windows Event Viewer for error messages
2. Verify all dependencies are installed
3. Reinstall the connector
4. Check that port 3306 is not blocked
5. Ensure the config file isn't corrupted (delete and reconfigure)

## 📊 Monitoring

### Status Indicators

The connector displays real-time status in the configuration window:

- **Status**: Shows if the sync is running or stopped
- **Last Sync**: Timestamp of the last successful sync
- **Total Events**: Total number of events synced since installation
- **Errors**: Number of errors encountered

### Logs

Logs are stored in:
- Windows: `%APPDATA%/scalehouse-connector/logs/`

Check logs for:
- Connection errors
- Permission denied errors
- API failures
- Sync statistics

## 🔄 Updates

To update the connector:

1. Download the latest MSI installer
2. Run the installer (it will automatically uninstall the old version)
3. Your configuration will be preserved
4. Restart the connector

## 📞 Support

For issues or questions:
- Email: support@scalehousesystems.com
- Documentation: https://docs.scalehousesystems.com
- GitHub: https://github.com/scalehousesystems/scalehousesystems-connector

## ⚖️ Compliance

This connector is designed to support HIPAA compliance requirements by:

- Limiting access to audit logs only (no PHI data access)
- Using encrypted connections to the ScaleHouse API
- Implementing least-privilege access control
- Supporting audit trail requirements
- Enabling monitoring and logging of all sync activities

**Note:** While this connector supports compliance, it is the responsibility of the healthcare organization to ensure their overall HIPAA compliance program is adequate and properly implemented.
