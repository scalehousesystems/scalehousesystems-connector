# Development Guide

## Prerequisites

- Node.js 18+ installed
- Windows OS (for building MSI)
- Access to Open Dental MySQL database
- ScaleHouse API key

## Setup for Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file** (optional for development):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Add icon file:**
   - Create a 256x256 .ico file
   - Save it as `build/icon.ico`
   - Or use a placeholder icon from online generators

## Running in Development Mode

```bash
npm run dev
```

This will:
- Start the Electron app
- Open the system tray icon
- Show the configuration window if not configured
- Start syncing if already configured

## Testing

### Manual Testing

1. **First Run:**
   - Run `npm run dev`
   - Click system tray icon
   - Configure API endpoint and database credentials
   - Verify connection to both systems

2. **Sync Testing:**
   - Let the connector run for a few minutes
   - Check logs in: `%APPDATA%/scalehouse-connector/logs/`
   - Verify audit events appear in ScaleHouse platform

3. **System Tray:**
   - Right-click tray icon
   - Verify menu options work:
     - Configure
     - Start/Stop Sync
     - View Logs
     - Quit

### Configuration

The app uses electron-store for persistent configuration:
- Location: `%APPDATA%/scalehouse-connector/config.json`
- Contains: API key, endpoint, database config

### Logs

Logs are stored in:
- Windows: `%APPDATA%/scalehouse-connector/logs/connector.log`
- Shows connection status, sync activity, errors

## Building

### Build MSI Installer

```bash
npm run build:msi
```

Output: `build-output/ScaleHouse Connector 1.0.0.msi`

### Build All Formats

```bash
npm run build:all
```

Outputs both NSIS and MSI installers.

## Architecture

### Main Components

1. **main.js** - Electron main process
   - Creates system tray icon
   - Manages configuration window
   - Handles app lifecycle

2. **connector.js** - Database polling
   - Connects to Open Dental MySQL
   - Queries for new audit events
   - Manages sync state

3. **api.js** - ScaleHouse API client
   - Sends audit events to platform
   - Tests API connectivity
   - Reports connector status

### Data Flow

```
Open Dental DB → connector.js → api.js → ScaleHouse Platform
```

1. Connector polls database every 5 minutes
2. Retrieves audit events since last sync
3. Sends events to ScaleHouse API in batches
4. Updates last sync timestamp

## Troubleshooting

### Icon Not Found Error

Create a dummy icon:
```bash
# Windows - create a basic icon file
echo "" > build/icon.ico
```

### Database Connection Fails

Check:
- MySQL is running
- Credentials are correct
- Database name is correct (default: opendental)
- Network connectivity to database server

### API Connection Fails

Check:
- API endpoint is correct
- API key is valid
- Network connectivity to ScaleHouse platform
- Firewall/proxy settings

### Build Fails

Common issues:
- Missing icon file
- Node.js version too old (need 18+)
- Missing dependencies (run `npm install`)

## Deployment

See README.md for deployment options:
- Static file hosting
- S3/R2
- GitHub Releases
