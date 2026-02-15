# PHI Protection Policy

## What is PHI?

Protected Health Information (PHI) includes:
- Patient names, addresses, phone numbers
- Social Security numbers
- Medical record numbers
- Health conditions, diagnoses, treatments
- Prescription information
- Insurance information
- Any other individually identifiable health information

## Our Guarantee: NO PHI ACCESS

The ScaleHouse Connector is designed with PHI protection as a core principle. Here's exactly what we DO and DO NOT access:

### ❌ NEVER ACCESSED (PHI Tables)

The following OpenDental tables contain PHI and are **NEVER** queried by this connector:

- `patient` - Patient demographic information
- `patientnote` - Patient clinical notes
- `procedurelog` - Treatment procedures
- `procedurecode` - Treatment codes
- `claim` - Insurance claims
- `medication` - Medications
- `medicationpat` - Patient medications
- `allergy` - Patient allergies
- `disease` - Patient diseases/conditions
- `vitalsign` - Patient vital signs
- `treatment` - Treatment plans
- `procnote` - Procedure notes
- `commlog` - Patient communications
- `emailmessage` - Email communications
- `familyhealth` - Family health history
- `guardian` - Patient guardians
- `patientrace` - Patient demographics
- `ehrpatient` - EHR patient data
- Any other table containing patient medical or personal information

### ✅ WHAT WE ACCESS (Audit/Metadata Only)

The connector ONLY queries the following non-PHI tables:

1. **`securitylog`** - Audit trail of user actions
   - User ID (not patient ID)
   - Action type (login, view, edit, delete)
   - Timestamp
   - Computer name
   - NO patient data

2. **`appointment`** - Appointment metadata ONLY
   - Appointment ID
   - Status (scheduled, complete, broken)
   - Timestamp
   - Provider ID
   - Clinic ID
   - NO patient names or medical information

3. **`loginattempt`** - Login security events
   - Username
   - Login timestamp
   - Success/failure
   - NO patient data

4. **`eservicelog`** - System integration logs
   - Service type
   - Timestamp
   - Severity level
   - NO patient data

5. **`securityloghash`** - Audit log integrity hashes
   - Cryptographic hashes
   - Timestamps
   - NO patient data

## SQL Query Examples

Here are the actual SQL queries used by the connector:

### Security Logs (Audit Trail)
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

**No PHI:** This query retrieves only metadata about user actions, not patient information.

### Appointment Changes
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

**No PHI:** This query retrieves only appointment status changes and timestamps. It does NOT include patient names, contact information, or medical details.

### Login Attempts
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

**No PHI:** This tracks system security events only.

## Compliance

This connector is designed to comply with:
- **HIPAA** - Health Insurance Portability and Accountability Act
- **HITECH** - Health Information Technology for Economic and Clinical Health Act

By accessing only audit logs and system metadata, we ensure:
1. No PHI is ever transmitted over the network
2. No PHI is ever stored outside the OpenDental database
3. Compliance teams can audit user actions without exposing patient data

## Verification

You can verify our PHI protection by:

1. **Reviewing the source code** in `src/connector.js`
2. **Inspecting database queries** - All SQL queries are clearly documented
3. **Running network capture** - Monitor what data is sent to ScaleHouse API
4. **Testing with production data** - No patient information will ever be transmitted

## Database User Permissions

We recommend creating a read-only database user with access ONLY to these tables:

```sql
-- Create read-only user for connector
CREATE USER 'scalehouse_connector'@'%' IDENTIFIED BY 'secure_password';

-- Grant SELECT only on specific tables
GRANT SELECT ON opendental.securitylog TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.appointment TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.loginattempt TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.eservicelog TO 'scalehouse_connector'@'%';
GRANT SELECT ON opendental.securityloghash TO 'scalehouse_connector'@'%';

-- Apply permissions
FLUSH PRIVILEGES;
```

This ensures the connector cannot access PHI even if compromised.

## Questions?

If you have concerns about PHI protection, please:
1. Review the source code in this repository
2. Contact ScaleHouse compliance team
3. Conduct your own security audit

We are committed to protecting patient privacy and maintaining HIPAA compliance.
