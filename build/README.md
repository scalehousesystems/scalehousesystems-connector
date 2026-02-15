# Build Resources

This directory contains resources needed for building the Windows installer.

## Required Files

### icon.ico
- **Size:** 256x256 pixels
- **Format:** .ico (Windows Icon)
- **Purpose:** Used for system tray, application window, and installer
- **Status:** Required before building

## How to Add Icon

1. Create or obtain a 256x256 pixel image of your ScaleHouse logo
2. Convert it to .ico format using:
   - Online: favicon.io, icoconvert.com
   - Software: GIMP, Photoshop, or icon editors
3. Save it as `icon.ico` in this directory
4. Remove or ignore the `icon.ico.placeholder` file

## Building Without Icon

If you attempt to build without an icon, electron-builder will fail. The icon is required for Windows builds.
