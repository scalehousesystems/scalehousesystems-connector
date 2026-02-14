# ScaleHouse Connector - UI Preview

## Main Configuration Window

The connector features a modern, professional interface with:

### Header Section
```
┌────────────────────────────────────────────────────────────┐
│  Purple Gradient Background (667eea → 764ba2)              │
│                                                             │
│               🏥 ScaleHouse Connector                       │
│            OpenDental MySQL Integration                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Status Bar
```
┌────────────────────────────────────────────────────────────┐
│  Status:       ✅ Running                                   │
│  Last Sync:    Feb 14, 2025 11:27:45 PM                    │
│  Total Events: 1,234                                        │
│  Errors:       0                                            │
└────────────────────────────────────────────────────────────┘
```
- Green background when running
- Red background when stopped
- Updates in real-time every 2 seconds

### Security Notice
```
┌────────────────────────────────────────────────────────────┐
│  🔒 Security Notice                                         │
│  This connector uses SELECT-only permissions on a           │
│  dedicated MySQL user account. Access is restricted to      │
│  the audit view and non-PHI reference tables only.          │
│  The database enforces least-privilege access control.      │
└────────────────────────────────────────────────────────────┘
```
- Yellow/amber background for visibility
- Explains security model to users

### Database Configuration Section
```
┌────────────────────────────────────────────────────────────┐
│  📊 Database Configuration                                  │
│                                                             │
│  MySQL Host *          [localhost                        ] │
│                        Database server hostname or IP       │
│                                                             │
│  MySQL Port            [3306                             ] │
│                                                             │
│  MySQL User *          [scalehouse_reader                ] │
│                        MySQL user with SELECT-only perms    │
│                                                             │
│  MySQL Password *      [••••••••••••                     ] │
│                                                             │
│  Database Name         [opendental                       ] │
│                                                             │
│  Audit View Name       [audit_log_view                   ] │
│                        The database view containing logs    │
│                                                             │
│  [  Test Database  ]                                        │
└────────────────────────────────────────────────────────────┘
```
- Clean form layout with labels
- Helpful placeholder text
- Help text under each field
- Password masking
- Test button for validation

### API Configuration Section
```
┌────────────────────────────────────────────────────────────┐
│  🔑 API Configuration                                       │
│                                                             │
│  ScaleHouse API Key *  [••••••••••••••••••••••••••••••••] │
│                        Your ScaleHouse platform API key     │
│                                                             │
│  API Endpoint          [https://api.scalehousesystems.com] │
│                                                             │
│  [   Test API   ]                                           │
└────────────────────────────────────────────────────────────┘
```
- API key masked like password
- Default endpoint pre-filled
- Test button for validation

### Sync Settings Section
```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Sync Settings                                           │
│                                                             │
│  Poll Interval (seconds)  [60                            ] │
│                           How often to check for new events │
│                                                             │
│  Batch Size               [100                           ] │
│                           Maximum events to sync per poll   │
│                                                             │
│  ☑ Auto-start connector on application launch              │
└────────────────────────────────────────────────────────────┘
```
- Numeric inputs with validation
- Checkbox for auto-start
- Helpful descriptions

### Action Buttons
```
┌────────────────────────────────────────────────────────────┐
│  [  💾 Save Configuration  ]  [  🔄 Reload  ]              │
│  [  ▶️ Start Sync         ]  [  ⏹️ Stop Sync ]              │
└────────────────────────────────────────────────────────────┘
```
- Purple gradient buttons for primary actions
- Gray buttons for secondary actions
- Green for start, red for stop
- Icons for visual recognition

### Success/Error Messages
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Configuration saved successfully!                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ❌ Failed to connect: Access denied for user               │
└────────────────────────────────────────────────────────────┘
```
- Green background for success
- Red background for errors
- Auto-dismiss after 5 seconds

## System Tray Icon

### Tray Icon
```
[🏥] ScaleHouse Connector - OpenDental
```
- Icon appears in Windows system tray (bottom-right)
- Tooltip shows app name

### Tray Menu (Right-Click)
```
┌────────────────────────────────────┐
│  Open Configuration                │
│  Status                            │
│  ─────────────────────────────────│
│  Start Sync                        │
│  Stop Sync                         │
│  ─────────────────────────────────│
│  Quit                              │
└────────────────────────────────────┘
```

### Status Popup (When Clicking "Status")
```
┌────────────────────────────────────┐
│  Connector Status                  │
│                                    │
│  Status: Running                   │
│  Last Sync: 2 minutes ago          │
│  Total Events: 1,234               │
│  Errors: 0                         │
│                                    │
│  [      OK      ]                  │
└────────────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Purple Gradient**: `#667eea` → `#764ba2`
- **Success Green**: `#10b981`
- **Error Red**: `#ef4444`
- **Warning Amber**: `#f59e0b`

### Text Colors
- **Headings**: `#111827` (dark gray)
- **Labels**: `#374151` (medium gray)
- **Help Text**: `#6b7280` (light gray)
- **Links**: `#667eea` (purple)

### Background Colors
- **Main Background**: Purple gradient (header)
- **Content Background**: White (`#ffffff`)
- **Input Fields**: White with `#d1d5db` border
- **Status Bar Running**: `#ecfdf5` (light green)
- **Status Bar Stopped**: `#fef2f2` (light red)
- **Security Notice**: `#fef3c7` (light yellow)

## Typography

- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **Heading Size**: `28px` (header), `18px` (sections)
- **Body Size**: `14px`
- **Help Text Size**: `12px`
- **Line Height**: `1.5`

## Interactions

### Hover Effects
- Buttons: Slight elevation with shadow
- Inputs: Purple border highlight
- Links: Underline

### Focus States
- Inputs: Purple border with soft glow
- Buttons: Slight scale increase

### Loading States
- Test buttons show "Testing..." during connection test
- Save button shows "Saving..." during save

## Responsive Design

The window is fixed at 800x600 pixels for consistency, but the design is clean and all elements are clearly visible.

## Accessibility

- High contrast text
- Clear labels and descriptions
- Keyboard navigation support
- Screen reader friendly

## Visual Comparison

**Before (No UI):**
```
❌ No application existed
❌ No configuration interface
❌ No status monitoring
```

**After (This Implementation):**
```
✅ Professional Electron application
✅ Beautiful gradient UI
✅ Real-time status dashboard
✅ System tray integration
✅ Test connection buttons
✅ Auto-start capability
✅ Error handling and feedback
```

## Screenshots (Mockup)

Since this is a headless environment, here's what users will see:

1. **First Launch**: Configuration window opens with empty fields
2. **Configured**: All fields filled, status shows "Stopped"
3. **Running**: Green status bar, "Running", real-time sync updates
4. **Testing**: Loading state on test buttons
5. **Error**: Red error message if connection fails
6. **Success**: Green success message when saved
7. **System Tray**: Icon visible in Windows taskbar

The interface is:
- ✅ Modern and professional
- ✅ Easy to understand
- ✅ Provides clear feedback
- ✅ Matches the ScaleHouse brand
- ✅ Enterprise-quality design
