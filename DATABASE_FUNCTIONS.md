# OpenDental MySQL Database Functions - Technical Specification

## Overview

This document confirms the specific functions and SQL queries used by the ScaleHouse Connector MSI when installed on a Windows system to access the OpenDental MySQL database.

## Database Connection

The MSI installer, when configured, establishes a MySQL connection using the `mysql2` Node.js library.

### Connection Details
- **Host**: Configurable (default: localhost)
- **Port**: Configurable (default: 3306)
- **Database**: Configurable (default: opendental)
- **User**: Configurable (recommend read-only user)
- **Authentication**: Standard MySQL password authentication

## Specific Functions Used

The connector implements the following specific functions in `src/connector.js`:

### 1. `connect()` - Database Connection
Establishes MySQL connection to the OpenDental database.

```javascript
async connect() {
  this.connection = await mysql.createConnection({
    host: this.config.dbHost,
    user: this.config.dbUser,
    password: this.config.dbPassword,
    database: this.config.dbName || 'opendental',
    port: this.config.dbPort || 3306,
  });
}
```

### 2. `getSecurityLogs(since)` - Security Audit Trail

**Purpose**: Retrieves user action audit logs for compliance tracking

**SQL Query**:
```sql
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
```

**Tables Accessed**: `securitylog`

**PHI Status**: ✅ NO PHI - Contains only user action logs, not patient data

### 3. `getAppointmentChanges(since)` - Appointment Status Tracking

**Purpose**: Tracks appointment status changes for workflow compliance

**SQL Query**:
```sql
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
```

**Tables Accessed**: `appointment`

**PHI Status**: ✅ NO PHI - Retrieves only appointment IDs, status codes, and timestamps. Does NOT retrieve patient names, contact info, or medical details.

### 4. `getLoginAttempts(since)` - Login Security Tracking

**Purpose**: Monitors login attempts for security compliance

**SQL Query**:
```sql
SELECT 
  LoginAttemptNum,
  UserName,
  AttemptDateTime,
  LoginType
FROM loginattempt
WHERE AttemptDateTime > ?
ORDER BY AttemptDateTime ASC
LIMIT 1000
```

**Tables Accessed**: `loginattempt`

**PHI Status**: ✅ NO PHI - Contains only system user login events

### 5. `getEServiceLogs(since)` - Electronic Service Logs

**Purpose**: Tracks electronic service integrations

**SQL Query**:
```sql
SELECT 
  EServiceLogNum,
  ServiceType,
  LogDateTime,
  Severity
FROM eservicelog
WHERE LogDateTime > ?
ORDER BY LogDateTime ASC
LIMIT 1000
```

**Tables Accessed**: `eservicelog`

**PHI Status**: ✅ NO PHI - System integration logs only

### 6. `getSecurityLogHashes(since)` - Audit Log Integrity

**Purpose**: Retrieves cryptographic hashes for audit log integrity verification

**SQL Query**:
```sql
SELECT 
  SecurityLogHashNum,
  LogHash,
  DateTSecurityLog
FROM securityloghash
WHERE DateTSecurityLog > ?
ORDER BY DateTSecurityLog ASC
LIMIT 1000
```

**Tables Accessed**: `securityloghash`

**PHI Status**: ✅ NO PHI - Cryptographic hashes only

### 7. `verifyConnection()` - Database Verification

**Purpose**: Verifies database connection and checks for required tables

**SQL Query**:
```sql
SHOW TABLES LIKE '%'
```

**Tables Accessed**: Information schema only

**PHI Status**: ✅ NO PHI - Metadata query only

### 8. `testQuery()` - Connection Test

**Purpose**: Tests database connectivity

**SQL Query**:
```sql
SELECT COUNT(*) as count FROM securitylog
```

**Tables Accessed**: `securitylog`

**PHI Status**: ✅ NO PHI - Count query only, no data retrieved

### 9. `syncAuditData()` - Main Sync Function

**Purpose**: Main function that orchestrates all data collection

**Functions Called**:
1. `getSecurityLogs()`
2. `getAppointmentChanges()`
3. `getLoginAttempts()`
4. `getEServiceLogs()`
5. `getSecurityLogHashes()`

**PHI Status**: ✅ NO PHI - Combines only non-PHI audit data

## Tables Accessed - Summary

The MSI installation will access ONLY these OpenDental tables:

| Table Name | Purpose | PHI Status |
|------------|---------|------------|
| `securitylog` | User action audit trail | ✅ NO PHI |
| `appointment` | Appointment status metadata | ✅ NO PHI |
| `loginattempt` | Login security events | ✅ NO PHI |
| `eservicelog` | Electronic service logs | ✅ NO PHI |
| `securityloghash` | Audit log integrity hashes | ✅ NO PHI |

## Tables NEVER Accessed

The following OpenDental tables containing PHI are **NEVER** queried:

- ❌ `patient` - Patient demographics
- ❌ `patientnote` - Clinical notes
- ❌ `procedurelog` - Treatment procedures
- ❌ `claim` - Insurance claims
- ❌ `medication` / `medicationpat` - Medications
- ❌ `allergy` / `allergydef` - Allergies
- ❌ `disease` / `diseasedef` - Diseases/conditions
- ❌ `vitalsign` - Vital signs
- ❌ `treatplan` - Treatment plans
- ❌ `procnote` - Procedure notes
- ❌ `commlog` - Patient communications
- ❌ `emailmessage` - Emails
- ❌ `familyhealth` - Family history
- ❌ `ehrpatient` - EHR patient data
- ❌ And 300+ other tables containing PHI

## Data Flow

```
┌─────────────────┐
│  MSI Installer  │
│   (Windows)     │
└────────┬────────┘
         │
         │ Installs
         ▼
┌─────────────────┐
│   Electron App  │
│  (System Tray)  │
└────────┬────────┘
         │
         │ Polls every 5 min
         ▼
┌─────────────────┐     ┌──────────────────┐
│  OpenDental DB  │◄────│  MySQL Queries   │
│    (MySQL)      │     │  (5 functions)   │
└────────┬────────┘     └──────────────────┘
         │
         │ Returns audit data
         │ (NO PHI)
         ▼
┌─────────────────┐
│  Data Filter    │
│  (Connector.js) │
└────────┬────────┘
         │
         │ JSON payload
         ▼
┌─────────────────┐     ┌──────────────────┐
│ ScaleHouse API  │◄────│   HTTPS POST     │
│  (Cloud SaaS)   │     │  (api.js)        │
└─────────────────┘     └──────────────────┘
```

## MSI Installation Behavior

When the MSI is installed:

1. **Installs to**: `C:\Program Files\ScaleHouse Connector\`
2. **Creates**: Windows system tray application
3. **Runs as**: Windows service in system tray
4. **On first run**: Opens browser to activation page for configuration
5. **After configuration**: 
   - Connects to OpenDental MySQL database
   - Verifies required tables exist
   - Starts polling every 5 minutes (configurable)
   - Sends audit data to ScaleHouse API

## Security Recommendations

1. **Create read-only database user** with access ONLY to the 5 tables listed above
2. **Use strong passwords** for database authentication
3. **Enable SSL/TLS** for MySQL connections if available
4. **Monitor connector logs** for any issues
5. **Review API traffic** to verify no PHI is transmitted

## Verification Steps

To verify PHI protection:

1. **Review source code**: All SQL queries are in `src/connector.js`
2. **Enable MySQL query logging**: Monitor actual queries executed
3. **Run network capture**: Inspect data sent to ScaleHouse API
4. **Test with production database**: Confirm no patient data appears in logs

## MySQL User Permissions Script

```sql
-- Create dedicated read-only user for ScaleHouse Connector
CREATE USER 'scalehouse_connector'@'%' 
  IDENTIFIED BY 'your_secure_password_here';

-- Grant SELECT on ONLY the required tables
GRANT SELECT ON opendental.securitylog TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.appointment TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.loginattempt TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.eservicelog TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.securityloghash TO 'scalehouse_connector'@'%';

-- Apply permissions
FLUSH PRIVILEGES;

-- Verify permissions (should show only 5 tables)
SHOW GRANTS FOR 'scalehouse_connector'@'%';
```

## Conclusion

✅ **CONFIRMED**: The ScaleHouse Connector MSI uses specific, documented MySQL functions to query ONLY 5 audit-related tables in the OpenDental database.

✅ **CONFIRMED**: The connector NEVER accesses, queries, or transmits Protected Health Information (PHI).

✅ **CONFIRMED**: All database queries are explicit, documented, and limited to compliance/audit data.

For questions or security audits, contact ScaleHouse Systems compliance team.
