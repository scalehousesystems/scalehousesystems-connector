# ScaleHouse Connector - OpenDental MySQL Integration

Windows desktop application that syncs OpenDental audit events to ScaleHouse compliance platform.

## 🔒 Security-First Design

This connector implements **least-privilege access control**:
- Uses a dedicated MySQL user with **SELECT-only** permissions
- Access restricted to a single audit view (no PHI tables)
- Database engine enforces security - even if compromised, MySQL rejects unauthorized queries
- Industry-standard enterprise security pattern

## ✨ Features

- 🖥️ **Modern GUI**: Easy-to-use configuration interface
- 🔐 **Secure**: SELECT-only MySQL permissions, encrypted API communication
- 📊 **Real-time Monitoring**: Live status dashboard with sync statistics
- 🔄 **Automatic Sync**: Configurable polling interval for audit events
- 🎯 **System Tray Integration**: Runs in background, accessible from tray icon
- 📦 **MSI Installer**: Professional Windows installer with auto-update support
- ⚡ **Efficient**: Batch processing with configurable sync intervals

## 📁 Project Structure

```
/scalehouse-connector
  /src
    main.js        # Electron main process with system tray
    connector.js   # MySQL database polling logic (SELECT-only)
    api.js         # API calls to ScaleHouse platform
    renderer.js    # GUI event handlers
    index.html     # Configuration interface
  /build
    icon.ico       # Windows installer icon
    icon.png       # PNG versions at multiple sizes
  /scripts
    create-icon.js # Icon generation script
  package.json     # Dependencies and build config
  .env.example     # Environment variables template
  SETUP.md         # Detailed setup and security guide
```

## 🚀 Quick Start

### For End Users

1. **Download** the MSI installer from your ScaleHouse admin panel
2. **Install** by running the MSI as Administrator
3. **Configure** the connector with your database and API credentials
4. **Start** syncing audit events to ScaleHouse

See [SETUP.md](SETUP.md) for detailed setup instructions including MySQL user creation and security configuration.

### For Developers

## 🚀 Setup

### 1. Install Dependencies

```bash
cd scalehouse-connector
npm install
```

### 2. Add Icon

Place your Windows icon at `/build/icon.ico` (256x256 .ico file)

If you don't have one, download a placeholder:
```bash
# Or use any .ico generator online
```

### 3. Test Locally (Optional)

```bash
npm run dev
```

## 📚 Documentation

### For End Users
- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference card for installation and daily use
- **[UI_PREVIEW.md](UI_PREVIEW.md)** - Visual preview of the interface

### For IT Staff & DBAs
- **[SETUP.md](SETUP.md)** - Comprehensive setup guide with security best practices
- **[database/setup.sql](database/setup.sql)** - Automated MySQL user and view setup script

### For Developers
- **[BUILD.md](BUILD.md)** - Build instructions and MSI creation guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture, security model, and deployment patterns
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation details

### Configuration
- **[.env.example](.env.example)** - Configuration template with examples

## 🔨 Build MSI Installer

### Build for Windows

```bash
npm run build:msi
```

This creates:
- `dist/ScaleHouse Connector Setup 1.0.0.exe` (NSIS installer)
- `dist/ScaleHouse Connector 1.0.0.msi` (MSI installer)

### Build Both Formats

```bash
npm run build:all
```

## 📦 Where MSI Goes

After building, the MSI file will be at:
```
scalehouse-connector/dist/ScaleHouse Connector 1.0.0.msi
```

**Rename it to:**
```
ScaleHouseConnector-latest.msi
```

## 🌐 Deploy to Your SaaS

### Option 1: Static File (Simple)

1. Copy MSI to your SaaS public folder:
```bash
cp "dist/ScaleHouse Connector 1.0.0.msi" ../scalehousesystems/public/downloads/ScaleHouseConnector-latest.msi
```

2. Commit and deploy:
```bash
cd ../scalehousesystems
git add public/downloads/ScaleHouseConnector-latest.msi
git commit -m "Add connector MSI installer"
git push
```

Users download from: `https://scalehousesystems.com/downloads/ScaleHouseConnector-latest.msi`

### Option 2: S3/R2 (Recommended)

1. Upload to S3:
```bash
aws s3 cp "dist/ScaleHouse Connector 1.0.0.msi" s3://scalehouse-installers/ScaleHouseConnector-latest.msi --acl public-read
```

2. Update download URL in your SaaS:
```tsx
// In your download page
const DOWNLOAD_URL = 'https://installers.scalehousesystems.com/ScaleHouseConnector-latest.msi';
```

### Option 3: GitHub Releases (Free)

1. Create GitHub release
2. Upload MSI as release asset
3. Link from your SaaS:
```
https://github.com/scalehouse/connector/releases/download/v1.0.0/ScaleHouseConnector-latest.msi
```

## 🔄 Auto-Updates (Future)

To enable auto-updates:

1. Host `latest.yml` file:
```yaml
version: 1.0.0
path: ScaleHouseConnector-latest.msi
sha512: <file-hash>
releaseDate: 2025-02-08
```

2. Update `package.json`:
```json
"publish": {
  "provider": "generic",
  "url": "https://installers.scalehousesystems.com"
}
```

## 🧪 Testing

After building, test the MSI:

1. Install on Windows VM or test machine
2. Check system tray for connector icon
3. Verify browser opens to activation page
4. Configure with test API key
5. Check database connection
6. Verify events sync to your SaaS

## 📝 Notes

- **File Size:** MSI will be ~45-50MB
- **Code Signing:** For production, sign the MSI with a code signing certificate
- **Version Bumps:** Update `version` in `package.json` before each build
- **Database:** Connector needs network access to Open Dental MySQL database

## 🐛 Troubleshooting

**Build fails:**
- Check Node.js version (need v18+)
- Make sure icon.ico exists in `/build`
- Run `npm install` again

**MSI won't install:**
- Run as Administrator
- Check Windows SmartScreen settings
- Sign the MSI with code signing cert (for production)

**Connector won't start:**
- Check Windows Event Viewer
- Verify API endpoint is accessible
- Check database credentials

## 📚 Resources

- [electron-builder docs](https://www.electron.build/)
- [Electron docs](https://www.electronjs.org/docs/latest/)
- [Code signing guide](https://www.electron.build/code-signing)