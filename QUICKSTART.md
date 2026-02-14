# ScaleHouse Connector - Quick Reference Card

## 🚀 Installation

1. Download `ScaleHouseConnector-latest.msi`
2. Right-click → **Run as Administrator**
3. Follow the installation wizard
4. Look for the connector icon in your system tray (bottom-right)

## ⚙️ First-Time Setup

### Step 1: Database Configuration

Double-click the system tray icon to open the configuration window.

**Required Settings:**
- **MySQL Host**: `localhost` (or your server IP)
- **MySQL Port**: `3306`
- **MySQL User**: `scalehouse_reader`
- **MySQL Password**: Your database password
- **Database Name**: `opendental`
- **Audit View Name**: `audit_log_view`

**Test It:** Click **Test Database** button

### Step 2: API Configuration

**Required Settings:**
- **ScaleHouse API Key**: Get from your ScaleHouse admin panel
- **API Endpoint**: `https://api.scalehousesystems.com`

**Test It:** Click **Test API** button

### Step 3: Save & Start

1. Click **💾 Save Configuration**
2. Click **▶️ Start Sync**
3. Minimize window - connector runs in background

## 📊 Monitoring

### Status Dashboard

The configuration window shows:
- ✅ **Status**: Running or Stopped
- 🕐 **Last Sync**: When last sync occurred
- 📈 **Total Events**: Number of events synced
- ⚠️ **Errors**: Error count (should be 0)

### System Tray Menu

Right-click the tray icon:
- **Open Configuration** - View/edit settings
- **Status** - Quick status popup
- **Start Sync** - Begin syncing
- **Stop Sync** - Stop syncing
- **Quit** - Exit the connector

## 🔒 Security Features

✅ **SELECT-only** MySQL permissions  
✅ **No access** to patient tables  
✅ **No write** capability  
✅ **Encrypted** API communication  
✅ **Least-privilege** access control  

The database enforces these restrictions - even if the connector is compromised, MySQL will reject any unauthorized queries.

## 🐛 Troubleshooting

### Connection Issues

**"Access Denied" Error**
- Verify MySQL user exists
- Check username/password
- Ensure user has SELECT permission on audit view

**"View Doesn't Exist" Error**
- Ask your DBA to create the audit_log_view
- Verify view name in configuration

**"Connection Timeout" Error**
- Check MySQL is running
- Verify firewall allows port 3306
- Test with: `mysql -h localhost -u scalehouse_reader -p`

### No Events Syncing

1. Check **Last Sync** time - should update every 60 seconds
2. Verify new events exist in database
3. Click **Test API** to verify connection
4. Check Errors count in status

### Connector Won't Start

1. Check Windows Event Viewer for errors
2. Reinstall the connector
3. Verify configuration is saved
4. Contact support@scalehousesystems.com

## 📞 Support

**Email:** support@scalehousesystems.com  
**Documentation:** [SETUP.md](SETUP.md)  
**GitHub:** https://github.com/scalehousesystems/scalehousesystems-connector

## 🔄 Auto-Start

To start syncing automatically when Windows boots:

1. Open configuration window
2. Check ☑️ **Auto-start connector on application launch**
3. Click **💾 Save Configuration**

The connector will now start syncing automatically.

## ⚡ Performance

**Default Settings:**
- **Poll Interval**: 60 seconds (how often to check for new events)
- **Batch Size**: 100 events (max events per sync)

These can be adjusted in the configuration window if needed.

## 📝 Best Practices

✅ Use a dedicated MySQL user  
✅ Set a strong password  
✅ Test connections before saving  
✅ Monitor errors regularly  
✅ Keep Windows and MySQL updated  
✅ Enable auto-start for unattended operation  

---

**Version:** 1.0.0  
**Last Updated:** February 2025  
**License:** Proprietary - ScaleHouse Systems
