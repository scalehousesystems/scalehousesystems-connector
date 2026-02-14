-- ===========================================================================
-- ScaleHouse Connector - OpenDental MySQL Setup Script
-- ===========================================================================
-- 
-- This script creates a dedicated MySQL user with SELECT-only permissions
-- for the ScaleHouse Connector. This follows the principle of least privilege
-- and ensures the connector cannot modify any data.
--
-- INSTRUCTIONS:
-- 1. Review and modify the configuration section below
-- 2. Run this script as a MySQL administrator/root user
-- 3. Save the password securely - you'll need it for the connector
-- 4. Verify the permissions using the verification queries at the end
--
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- CONFIGURATION - Modify these values for your environment
-- ---------------------------------------------------------------------------

-- Database name (usually 'opendental')
SET @db_name = 'opendental';

-- Connector user name
SET @user_name = 'scalehouse_reader';

-- Host from which the connector will connect
-- Use 'localhost' if connector runs on same machine as MySQL
-- Use '%' to allow from any host (less secure)
-- Use specific IP like '192.168.1.100' for remote connection
SET @host_name = 'localhost';

-- Strong password for the connector user
-- CHANGE THIS to a secure password!
SET @user_password = 'CHANGE_ME_TO_SECURE_PASSWORD';

-- Audit view name (default: audit_log_view)
SET @audit_view = 'audit_log_view';

-- ---------------------------------------------------------------------------
-- STEP 1: Create the Audit View
-- ---------------------------------------------------------------------------
-- This view exposes only the audit log fields needed for compliance tracking
-- without exposing PHI (Protected Health Information)

USE opendental;

-- Drop existing view if it exists
DROP VIEW IF EXISTS audit_log_view;

-- Create the audit view
-- IMPORTANT: This assumes OpenDental's securitylog table structure
-- Adjust column names if your OpenDental version differs
CREATE VIEW audit_log_view AS
SELECT 
    sl.SecurityLogNum AS AuditLogNum,
    sl.PatNum,
    sl.UserNum,
    sl.LogDateTime,
    sl.LogText,
    sl.PermType,
    sl.FKey,
    sl.LogSource
FROM securitylog sl
WHERE sl.SecurityLogNum > 0
ORDER BY sl.SecurityLogNum;

-- Verify the view was created
SELECT 'Audit view created successfully' AS Status,
       COUNT(*) AS RecordCount 
FROM audit_log_view;

-- ---------------------------------------------------------------------------
-- STEP 2: Create the Connector User
-- ---------------------------------------------------------------------------

-- Drop existing user if it exists (uncomment if recreating)
-- SET @drop_user = CONCAT('DROP USER IF EXISTS ''', @user_name, '''@''', @host_name, '''');
-- PREPARE stmt FROM @drop_user;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- Create the user
SET @create_user = CONCAT(
    'CREATE USER ''', @user_name, '''@''', @host_name, 
    ''' IDENTIFIED BY ''', @user_password, ''''
);
PREPARE stmt FROM @create_user;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT CONCAT('User ''', @user_name, '''@''', @host_name, ''' created successfully') AS Status;

-- ---------------------------------------------------------------------------
-- STEP 3: Grant SELECT Permission on Audit View
-- ---------------------------------------------------------------------------

-- Grant SELECT permission ONLY on the audit view
SET @grant_view = CONCAT(
    'GRANT SELECT ON ', @db_name, '.', @audit_view,
    ' TO ''', @user_name, '''@''', @host_name, ''''
);
PREPARE stmt FROM @grant_view;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'SELECT permission granted on audit view' AS Status;

-- ---------------------------------------------------------------------------
-- STEP 4: (Optional) Grant SELECT on Non-PHI Reference Tables
-- ---------------------------------------------------------------------------
-- Uncomment the following if you need to expose additional reference tables
-- that do NOT contain PHI. Common examples:

-- User table (for user names in audit logs)
-- SET @grant_user = CONCAT('GRANT SELECT ON ', @db_name, '.userod TO ''', @user_name, '''@''', @host_name, '''');
-- PREPARE stmt FROM @grant_user;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- Permission definitions
-- SET @grant_perm = CONCAT('GRANT SELECT ON ', @db_name, '.permission TO ''', @user_name, '''@''', @host_name, '''');
-- PREPARE stmt FROM @grant_perm;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- STEP 5: Apply Privileges
-- ---------------------------------------------------------------------------

FLUSH PRIVILEGES;

SELECT 'Privileges flushed - configuration complete!' AS Status;

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================
-- Run these queries to verify the setup is correct

-- Show the created user
SELECT 
    User,
    Host,
    account_locked,
    password_expired
FROM mysql.user 
WHERE User = @user_name;

-- Show granted privileges (should only show SELECT on audit_log_view)
SET @show_grants = CONCAT('SHOW GRANTS FOR ''', @user_name, '''@''', @host_name, '''');
PREPARE stmt FROM @show_grants;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- SECURITY VERIFICATION
-- ===========================================================================
-- Test that the user CANNOT access PHI tables
-- 
-- To test, connect as the new user:
-- mysql -u scalehouse_reader -p opendental
--
-- Then run these queries:
--
-- This should WORK (returns records):
-- SELECT COUNT(*) FROM audit_log_view LIMIT 10;
--
-- These should FAIL with "Access Denied":
-- SELECT * FROM patient LIMIT 1;
-- SELECT * FROM appointment LIMIT 1;
-- SELECT * FROM securitylog LIMIT 1;
-- INSERT INTO audit_log_view (AuditLogNum) VALUES (1);
-- UPDATE audit_log_view SET LogText = 'test';
-- DELETE FROM audit_log_view WHERE AuditLogNum = 1;
--
-- ===========================================================================

-- ===========================================================================
-- TROUBLESHOOTING
-- ===========================================================================
--
-- If the connector cannot connect:
-- 1. Verify the user exists:
--    SELECT User, Host FROM mysql.user WHERE User = 'scalehouse_reader';
--
-- 2. Check grants:
--    SHOW GRANTS FOR 'scalehouse_reader'@'localhost';
--
-- 3. Verify the view exists:
--    SHOW FULL TABLES IN opendental WHERE TABLE_TYPE LIKE 'VIEW';
--
-- 4. Test view access:
--    SELECT COUNT(*) FROM opendental.audit_log_view;
--
-- 5. Check MySQL error log for authentication issues
--
-- To recreate the user:
-- 1. DROP USER 'scalehouse_reader'@'localhost';
-- 2. Run this script again
--
-- ===========================================================================

-- ===========================================================================
-- PASSWORD ROTATION
-- ===========================================================================
--
-- To change the password periodically:
-- ALTER USER 'scalehouse_reader'@'localhost' 
-- IDENTIFIED BY 'new_secure_password';
-- FLUSH PRIVILEGES;
--
-- Then update the connector configuration with the new password
--
-- ===========================================================================

SELECT '✅ Setup complete! Next steps:' AS Message
UNION ALL SELECT '1. Save the password securely'
UNION ALL SELECT '2. Configure the ScaleHouse Connector with these credentials'
UNION ALL SELECT '3. Test the connection using the connector Test Database button'
UNION ALL SELECT '4. Verify the user cannot access PHI tables (see Security Verification above)';
