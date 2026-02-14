# Building the ScaleHouse Connector

## Prerequisites

- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 8+ (comes with Node.js)
- **Windows**: Required for building MSI installer
- **Git**: For version control

## Quick Build

```bash
# 1. Clone the repository
git clone https://github.com/scalehousesystems/scalehousesystems-connector.git
cd scalehousesystems-connector

# 2. Install dependencies
npm install

# 3. Generate icon
npm run icon

# 4. Build MSI installer
npm run build:msi
```

The MSI installer will be created in: `build-output/ScaleHouse Connector 1.0.0.msi`

## Build Commands

### Development

```bash
# Start the app in development mode (with DevTools)
npm run dev

# Start the app normally
npm start
```

### Icon Generation

```bash
# Generate icons at multiple sizes
npm run icon
```

This creates:
- `build/icon.ico` - Windows icon file
- `build/icon.png` - PNG at 256x256
- `build/icon-*.png` - PNGs at 16, 32, 48, 64, 128, 256

### Production Build

```bash
# Build MSI installer only
npm run build:msi

# Build all Windows formats (MSI + NSIS)
npm run build
```

## Build Output

After running `npm run build:msi`, you'll find:

```
build-output/
├── ScaleHouse Connector 1.0.0.msi      # MSI installer
├── ScaleHouse Connector 1.0.0.msi.blockmap
└── latest.yml                          # Auto-update manifest
```

## Build Configuration

The build is configured in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.scalehouse.connector",
    "productName": "ScaleHouse Connector",
    "win": {
      "target": "msi",
      "icon": "build/icon.ico"
    }
  }
}
```

## Customization

### Change Version

Edit `package.json`:

```json
{
  "version": "1.0.1"
}
```

Then rebuild: `npm run build:msi`

### Change App Name

Edit `package.json`:

```json
{
  "name": "custom-connector-name",
  "build": {
    "productName": "Custom Connector Name"
  }
}
```

### Change Icon

1. Replace `build/icon.ico` with your custom icon (256x256 .ico file)
2. Or run `npm run icon` after modifying `scripts/create-icon.js`

### Change Build Output Directory

Edit `package.json`:

```json
{
  "build": {
    "directories": {
      "output": "dist"
    }
  }
}
```

## Code Signing (Recommended for Production)

### Windows Code Signing

To sign the MSI for production deployment:

1. **Obtain a Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, or other CA
   - Cost: ~$300-500/year

2. **Configure Signing**

   Add to `package.json`:

   ```json
   {
     "build": {
       "win": {
         "certificateFile": "path/to/certificate.pfx",
         "certificatePassword": "your-password",
         "signingHashAlgorithms": ["sha256"],
         "signDlls": true
       }
     }
   }
   ```

3. **Build with Signing**

   ```bash
   npm run build:msi
   ```

### Using Environment Variables (Recommended)

```bash
# Windows
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your-password
npm run build:msi

# Or use .env file (don't commit this!)
echo CSC_LINK=path/to/certificate.pfx > .env
echo CSC_KEY_PASSWORD=your-password >> .env
npm run build:msi
```

## Auto-Update Configuration

To enable auto-updates:

1. **Setup Update Server**
   
   Host the following files:
   - `ScaleHouseConnector-latest.msi` - Latest MSI
   - `latest.yml` - Update manifest

2. **Configure Update URL**

   Add to `package.json`:

   ```json
   {
     "build": {
       "publish": {
         "provider": "generic",
         "url": "https://installers.scalehousesystems.com"
       }
     }
   }
   ```

3. **Install electron-updater**

   ```bash
   npm install electron-updater
   ```

4. **Add Update Code**

   In `src/main.js`:

   ```javascript
   const { autoUpdater } = require('electron-updater');
   
   autoUpdater.checkForUpdatesAndNotify();
   ```

## Debugging Build Issues

### Clean Build

```bash
# Remove build artifacts
rm -rf build-output/
rm -rf node_modules/

# Reinstall and rebuild
npm install
npm run build:msi
```

### Verbose Build

```bash
# Enable debug output
set DEBUG=electron-builder
npm run build:msi
```

### Common Issues

**Issue: "Icon not found"**
```bash
# Ensure icon exists
npm run icon
ls build/icon.ico
```

**Issue: "electron-builder not found"**
```bash
# Reinstall dev dependencies
npm install --save-dev electron-builder
```

**Issue: "Cannot find module 'sharp'"**
```bash
# Reinstall dependencies
npm install
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build MSI

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build MSI
        run: npm run build:msi
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: msi-installer
          path: build-output/*.msi
```

## Testing the Build

### Install and Test

1. **Build the MSI**
   ```bash
   npm run build:msi
   ```

2. **Install on Test Machine**
   - Copy MSI to Windows VM or test machine
   - Right-click MSI → Run as Administrator
   - Follow installation wizard

3. **Test the Application**
   - Check system tray for icon
   - Open configuration window
   - Test database connection
   - Test API connection
   - Start sync and verify events are sent

### Uninstall

```bash
# Via Windows Settings
Settings → Apps → ScaleHouse Connector → Uninstall

# Via MSI
msiexec /x "ScaleHouse Connector 1.0.0.msi" /quiet

# Or run the MSI again and choose "Remove"
```

## Production Checklist

Before releasing to production:

- [ ] Update version number in `package.json`
- [ ] Test build on clean Windows installation
- [ ] Verify all features work correctly
- [ ] Sign the MSI with code signing certificate
- [ ] Test auto-update mechanism
- [ ] Create release notes
- [ ] Upload to distribution server
- [ ] Update download links
- [ ] Notify users of new version

## Distribution

### Option 1: Direct Download

Host the MSI on your web server:

```
https://scalehousesystems.com/downloads/ScaleHouseConnector-latest.msi
```

### Option 2: GitHub Releases

1. Create a new release on GitHub
2. Upload the MSI as a release asset
3. Users download from GitHub

### Option 3: S3/CloudFront

```bash
# Upload to S3
aws s3 cp build-output/ScaleHouse\ Connector\ 1.0.0.msi \
  s3://installers/ScaleHouseConnector-latest.msi \
  --acl public-read

# Access via CloudFront
https://cdn.scalehousesystems.com/ScaleHouseConnector-latest.msi
```

## Support

For build issues or questions:
- GitHub Issues: https://github.com/scalehousesystems/scalehousesystems-connector/issues
- Email: dev@scalehousesystems.com

## Resources

- [electron-builder docs](https://www.electron.build/)
- [Electron docs](https://www.electronjs.org/docs/latest/)
- [Windows Code Signing](https://www.electron.build/code-signing)
- [Auto-update](https://www.electron.build/auto-update)
