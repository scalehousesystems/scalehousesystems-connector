# ScaleHouse Connector - Architecture & Security

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Windows Machine                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         ScaleHouse Connector (Electron App)              │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   GUI       │  │  Connector   │  │   API        │   │  │
│  │  │ (Config)    │  │   Engine     │  │   Client     │   │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │  │
│  │         │               │                    │           │  │
│  └─────────┼───────────────┼────────────────────┼──────────┘  │
│            │               │                    │              │
│            │               ▼                    │              │
│            │    ┌──────────────────┐            │              │
│            │    │  MySQL Server    │            │              │
│            │    │  (OpenDental)    │            │              │
│            │    ├──────────────────┤            │              │
│            │    │  audit_log_view  │◄───────────┘              │
│            │    │  (SELECT only)   │                           │
│            │    └──────────────────┘                           │
│            │                                                    │
└────────────┼────────────────────────────────────────────────────┘
             │                                      │
             │                                      │ HTTPS
             │                                      ▼
             │                          ┌──────────────────────┐
             │                          │  ScaleHouse Platform │
             └──────────────────────────►  (Cloud API)         │
                  System Tray Icon       └──────────────────────┘
```

## Data Flow

```
1. Connector polls audit_log_view every 60 seconds (configurable)
   ↓
2. Query: SELECT * FROM audit_log_view WHERE AuditLogNum > [last_synced_id]
   ↓
3. MySQL returns up to 100 events (batch size)
   ↓
4. Connector transforms events to API format
   ↓
5. POST to ScaleHouse API via HTTPS
   ↓
6. API confirms receipt
   ↓
7. Connector updates last_synced_id
   ↓
8. Wait 60 seconds, repeat from step 1
```

## Security Model

### Least-Privilege Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                     MySQL Database                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │  PHI Tables (NO ACCESS)                           │     │
│  │  ─────────────────────────────────                │     │
│  │  • patient          ❌ Access Denied               │     │
│  │  • appointment      ❌ Access Denied               │     │
│  │  • treatment        ❌ Access Denied               │     │
│  │  • billing          ❌ Access Denied               │     │
│  │  • securitylog      ❌ Access Denied               │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Audit View (SELECT-ONLY ACCESS)                  │     │
│  │  ────────────────────────────────                 │     │
│  │  • audit_log_view   ✅ SELECT allowed             │     │
│  │                     ❌ INSERT denied               │     │
│  │                     ❌ UPDATE denied               │     │
│  │                     ❌ DELETE denied               │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │  MySQL User: scalehouse_reader                    │     │
│  │  ──────────────────────────────                   │     │
│  │  Permissions: GRANT SELECT ON audit_log_view      │     │
│  │  Host: localhost (or specific IP)                 │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Database Layer** (MySQL enforces)
   - User has ONLY SELECT permission
   - Access ONLY to audit_log_view
   - Cannot read patient, appointment, or other PHI tables
   - Cannot INSERT, UPDATE, or DELETE any data

2. **View Layer** (DBA defines)
   - View exposes only audit log fields
   - No PHI beyond PatNum identifier
   - No patient names, SSNs, addresses
   - Limited to compliance-relevant data

3. **Application Layer** (Connector)
   - Read-only operations
   - Encrypted storage of credentials
   - HTTPS-only API communication
   - No local data caching

4. **Network Layer**
   - TLS/SSL for API communication
   - Optional: VPN for remote database access
   - Firewall rules for port 3306

### What Happens if Compromised?

**Scenario:** Attacker gains access to connector code or credentials

**Result:** Limited damage due to security controls

```
Attacker attempts:
├─ Read patient table       → ❌ MySQL: Access Denied
├─ Read appointment table   → ❌ MySQL: Access Denied  
├─ Modify audit logs        → ❌ MySQL: Permission Denied
├─ Delete audit logs        → ❌ MySQL: Permission Denied
├─ Create new users         → ❌ MySQL: Permission Denied
└─ Read audit_log_view      → ✅ Allowed (non-PHI data only)
```

**Maximum Exposure:** Audit log metadata (who accessed what, when)  
**No Exposure:** Patient names, SSNs, addresses, medical records, billing

## Configuration Security

### Local Storage

```
┌────────────────────────────────────┐
│  Electron Store (encrypted)        │
├────────────────────────────────────┤
│  • Database host                   │
│  • Database user                   │
│  • Database password (encrypted)   │
│  • API key (encrypted)             │
│  • Sync settings                   │
└────────────────────────────────────┘
```

Stored at: `%APPDATA%/scalehouse-connector/config.json`

### Best Practices

1. ✅ Use a dedicated MySQL user
2. ✅ Strong, unique password
3. ✅ Restrict by host (`localhost` not `%`)
4. ✅ Regular password rotation
5. ✅ Monitor audit logs for unusual access
6. ✅ Keep Windows and MySQL updated
7. ✅ Use firewall rules
8. ✅ Enable MySQL SSL/TLS for remote connections

## Compliance

### HIPAA Considerations

This connector supports HIPAA compliance by:

✅ **Minimum Necessary Rule**
- Access limited to audit logs only
- No access to full medical records

✅ **Access Control**
- Unique user IDs (dedicated MySQL user)
- Automatic logoff (connector stops on close)
- Encryption (stored credentials, API communication)

✅ **Audit Controls**
- All database access logged by MySQL
- Connector tracks sync activity
- API maintains audit trail

✅ **Integrity**
- Read-only access prevents data modification
- Database enforces restrictions

✅ **Transmission Security**
- HTTPS/TLS for API communication
- Optional SSL for MySQL connections

**Note:** While this connector supports compliance, healthcare organizations must ensure their overall HIPAA compliance program is adequate.

## Performance & Scalability

### Resource Usage

- **CPU**: Minimal (polls every 60 seconds)
- **Memory**: ~50-100 MB (Electron app)
- **Disk**: ~100 MB (application + logs)
- **Network**: ~1-10 KB per sync (depends on event count)

### Scaling Limits

- **Events per sync**: Up to 100 (configurable)
- **Poll frequency**: Minimum 10 seconds (configurable)
- **Database connections**: 2 pooled connections

### Optimization Tips

- Increase batch size for high-volume practices
- Adjust poll interval based on event frequency
- Monitor error logs for connection issues
- Consider dedicated MySQL slave for connector

## Monitoring & Logging

### Application Logs

Located at: `%APPDATA%/scalehouse-connector/logs/`

### Metrics Tracked

- Total events synced
- Last sync timestamp
- Error count
- Connection status

### Alerts

Configure ScaleHouse platform to alert on:
- Sync failures
- Extended periods without data
- Authentication errors

## Deployment Patterns

### Single Practice

```
[OpenDental DB] ←→ [Connector] ─→ [ScaleHouse API]
    localhost        Same machine      Cloud
```

### Multi-Location Practice

```
Location 1: [DB] ←→ [Connector 1] ─┐
Location 2: [DB] ←→ [Connector 2] ─┼→ [ScaleHouse API]
Location 3: [DB] ←→ [Connector 3] ─┘
```

### Enterprise (Centralized Database)

```
[Central OpenDental DB] ←→ [Connector] ─→ [ScaleHouse API]
  (Multiple locations)      (1 connector)    Cloud
```

## Updates & Maintenance

### Automatic Updates

- Check for updates on startup
- Download MSI from ScaleHouse platform
- Prompt user to install
- Configuration preserved across updates

### Manual Updates

1. Download latest MSI
2. Run installer (auto-uninstalls old version)
3. Configuration preserved
4. Restart connector

### Rollback

If issues occur:
1. Uninstall current version
2. Install previous MSI version
3. Configuration preserved

---

**For detailed setup instructions, see [SETUP.md](SETUP.md)**  
**For quick reference, see [QUICKSTART.md](QUICKSTART.md)**
