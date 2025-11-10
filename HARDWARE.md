# 🔌 Hardware Integration Documentation

## Overview

Paradise POS includes comprehensive hardware integration supporting essential retail devices for Sri Lankan businesses. The system uses modern Web APIs (Web Serial API, Web Bluetooth API) to enable browser-based hardware control.

---

## 🎯 Supported Hardware

### 1. Receipt Printers
- **Thermal Receipt Printers** (ESC/POS Protocol)
  - Epson TM-T88 Series (T88V, T88VI)
  - Epson TM-T20 Series
  - Star TSP100 Series
  - Star TSP650 Series
  - Generic ESC/POS compatible printers
- **Connection Types**: USB, Serial, Ethernet, Bluetooth
- **Features**: Auto-cut, cash drawer kick-out, logo printing, QR codes

### 2. Barcode Scanners
- **Supported Types**:
  - USB Keyboard Wedge Scanners (Plug-and-play)
  - USB Serial Scanners (Web Serial API)
  - Bluetooth Scanners (Web Bluetooth API)
- **Barcode Formats**:
  - EAN-13 (International Article Number)
  - EAN-8 (Shortened EAN)
  - UPC-A (Universal Product Code)
  - UPC-E (Compressed UPC)
  - CODE-39 (Alphanumeric)
  - CODE-128 (High-density)
  - QR Code (2D barcodes)
- **Validation**: Automatic checksum validation using Luhn algorithm

### 3. Cash Drawers
- **Compatible Models**: Any cash drawer with RJ11/RJ12 connection
- **Connection**: Through printer kick-out port (no separate interface needed)
- **Trigger Methods**:
  - Manual open
  - Auto-open on sale completion
  - Auto-open on refund
  - Custom triggers via API

### 4. Payment Terminals
- **Card Types**: VISA, Mastercard, American Express, Discover, Diners Club, JCB, UnionPay
- **Payment Methods**:
  - Chip & PIN (EMV)
  - Magnetic Stripe
  - NFC/Contactless (Tap to Pay)
- **Sri Lankan Payment Gateways**:
  - Commercial Bank PayGate
  - Sampath Vishwa
  - HNB PayGate
  - DFCC PayGate
  - Nations Trust Bank
  - PayHere
  - iPay
  - LankaPay
- **Features**: Card validation, refunds, transaction tracking, test mode

### 5. Customer Display (Upcoming)
- **Types**: VFD (Vacuum Fluorescent Display), LCD, LED
- **Connection**: USB Serial, RS-232
- **Features**: Real-time price display, promotional messages

### 6. Weight Scales (Upcoming)
- **Types**: Digital scales with serial/USB output
- **Features**: Auto-tare, unit conversion (kg/g/lb), stable reading detection

---

## 🚀 Quick Start

### 1. Access Hardware Configuration
```
Hardware Config:     http://localhost:4200/hardware
Status Dashboard:    http://localhost:4200/hardware/status
Receipt Designer:    http://localhost:4200/hardware/receipt-designer
```

### 2. Add Your First Device

1. Click **"Add Device"** button
2. Select device type (Printer, Scanner, etc.)
3. Enter device name and select connection type
4. Configure device-specific settings
5. Click **"Save"**
6. Click **"Test Device"** to verify connection

---

## ⚙️ Device Configuration

### Receipt Printer Setup

#### USB Connection
1. Connect printer via USB cable
2. In Hardware Config, click **"Add Device"** → **Printer**
3. Fill in details:
   ```
   Name: Main Receipt Printer
   Type: Printer
   Connection: USB
   Printer Type: ESC/POS (or select your printer brand)
   Paper Width: 80mm (or 58mm)
   Character Encoding: utf-8
   ```
4. Click **"Test Print"** to print a test receipt

#### Network/Ethernet Connection
1. Connect printer to network and note IP address
2. Configuration:
   ```
   Connection: Network
   Network Address: 192.168.1.100 (your printer IP)
   Port: 9100 (default ESC/POS port)
   ```

#### Bluetooth Connection
1. Pair printer with computer via Bluetooth
2. Configuration:
   ```
   Connection: Bluetooth
   Device Name: [Your printer name]
   ```
3. Browser will prompt for Bluetooth pairing

#### ESC/POS Command Reference
```javascript
// Initialize
const ESC = '\x1B';
const GS = '\x1D';

// Common Commands
ESC + '@'           // Initialize printer
ESC + 'a' + '1'     // Center align
ESC + 'a' + '0'     // Left align
ESC + 'E' + '1'     // Bold on
ESC + 'E' + '0'     // Bold off
ESC + '!' + '\x20'  // Double height
ESC + '!' + '\x00'  // Normal size
GS + 'V' + '\x41'   // Cut paper
GS + 'v' + '0'      // Print barcode
```

### Barcode Scanner Setup

#### Keyboard Wedge Scanner (Recommended)
1. Simply plug scanner into USB port
2. Scanner works immediately as keyboard input
3. No configuration needed in Paradise POS
4. Scanner automatically detected when barcode scanned

#### USB Serial Scanner
1. Connect scanner via USB
2. Configuration:
   ```
   Name: Barcode Scanner
   Type: Scanner
   Connection: USB
   Prefix: (leave blank unless scanner adds prefix)
   Suffix: (leave blank unless scanner adds suffix)
   ```
3. Browser will prompt for USB device permission
4. Test by scanning a barcode

#### Barcode Format Detection
The system automatically detects:
- **EAN-13**: 13 digits (e.g., 9780262025591)
- **EAN-8**: 8 digits
- **UPC-A**: 12 digits starting with 0-9
- **CODE-128**: Alphanumeric with start character

### Cash Drawer Setup

1. **Physical Connection**:
   ```
   Cash Drawer RJ11 Cable → Printer Kick-Out Port
   ```

2. **Software Configuration**:
   ```
   Name: Cash Drawer
   Type: Cash Drawer
   Connection: Serial (through printer)
   Link to Printer: [Select your receipt printer]
   Open Command: ESC/POS Standard (or select your printer brand)
   ```

3. **Custom Open Commands** (if standard doesn't work):
   ```javascript
   // ESC/POS Standard
   [27, 112, 0, 50, 250]  // ESC p 0 50 250

   // Star Printers
   [7]  // BEL character

   // Epson
   [27, 112, 48, 55, 121]  // ESC p 0 55 121
   ```

4. **Auto-Open Settings**:
   - ✅ Open on sale completion
   - ✅ Open on cash payment
   - ⬜ Open on refund
   - ⬜ Require drawer close confirmation

### Payment Terminal Setup

1. **Select Gateway**:
   ```
   Name: Payment Terminal
   Type: Payment Terminal
   Connection: Network (or USB/Serial based on terminal)
   ```

2. **Gateway Configuration** (Example: Commercial Bank):
   ```
   Gateway: Commercial Bank PayGate
   Merchant ID: [Your merchant ID]
   Terminal ID: [Your terminal ID]
   API Key: [Your API key]
   Test Mode: ✅ (for testing)
   ```

3. **Supported Gateways**:

   | Gateway | Connection | Features |
   |---------|------------|----------|
   | Commercial Bank | HTTPS | EMV, NFC, QR |
   | Sampath Vishwa | HTTPS | EMV, NFC |
   | HNB PayGate | HTTPS | EMV, Masterpass |
   | DFCC | HTTPS | EMV, NFC |
   | PayHere | HTTPS API | Online payments |
   | iPay | HTTPS API | Online payments |
   | LankaPay | HTTPS | Local cards |

4. **Card Validation**:
   - Automatic Luhn checksum validation
   - Card type detection (VISA, Mastercard, etc.)
   - Expiry date validation

---

## 🧪 Testing Devices

### Test Print Receipt
```typescript
// Automatic test receipt includes:
- Business name and address
- Test items with prices
- Subtotal, tax, total
- Barcode (if supported)
- Cut command
```

### Test Scanner
1. Click **"Test Scanner"**
2. Scan any barcode
3. Result shows:
   - Scanned code
   - Detected format (EAN-13, CODE-128, etc.)
   - Checksum validation status
   - Timestamp

### Test Cash Drawer
```typescript
// Sends open command
// Expected: Drawer pops open
// Status: "Opened" or "Failed"
```

### Test Payment Terminal
```typescript
// Test transaction: LKR 1.00
// Card: 4111111111111111 (Test VISA)
// Expiry: 12/25
// CVV: 123
// Expected: Approved in test mode
```

---

## 📊 Hardware Status Monitoring

### Connection Status
- 🟢 **Connected**: Device operational
- 🟡 **Disconnected**: Device not responding
- 🔴 **Error**: Device error state

### Event Log
View recent hardware events:
- Device connections/disconnections
- Successful operations (print, scan, payment)
- Errors and failures
- Timestamp for all events

### Statistics
- Total devices registered
- Connected devices count
- Failed connection attempts
- Operations per device (prints, scans, transactions)

---

## 🔧 Troubleshooting

### Printer Issues

**Printer Not Found**
- ✅ Check USB/network connection
- ✅ Verify printer is powered on
- ✅ Check printer driver installed (for USB)
- ✅ Test print from Windows/system settings
- ✅ Verify IP address (for network printers)

**Garbled/Incorrect Output**
- ✅ Check character encoding (use UTF-8)
- ✅ Verify paper width setting (58mm vs 80mm)
- ✅ Ensure correct printer type selected (ESC/POS, Star, Epson)
- ✅ Update printer firmware

**Cash Drawer Not Opening**
- ✅ Check RJ11 cable connection
- ✅ Verify drawer connected to correct printer port
- ✅ Try different open command (ESC/POS, Star, Epson)
- ✅ Test drawer with manual command from printer utility

**No Auto-Cut**
- ✅ Enable "Auto Cut" in printer settings
- ✅ Check if printer supports auto-cut
- ✅ Verify cut command in ESC/POS sequence

### Scanner Issues

**Scanner Not Detecting**
- ✅ Check USB connection
- ✅ Verify scanner beeps when scanning (indicates hardware working)
- ✅ Test scanner in Notepad (keyboard wedge scanners)
- ✅ Grant USB permission when browser prompts
- ✅ Check scanner configuration (prefix/suffix)

**Wrong Barcode Format**
- ✅ Enable correct symbology in scanner settings
- ✅ Configure scanner to output raw barcode (no prefix/suffix)
- ✅ Check barcode is not damaged
- ✅ Ensure adequate lighting

**Duplicate Scans**
- ✅ Increase scan interval setting
- ✅ Configure scanner for single scan mode
- ✅ Check for scanner double-trigger

### Payment Terminal Issues

**Terminal Not Responding**
- ✅ Check connection (USB/Serial/Network)
- ✅ Verify terminal powered on
- ✅ Test terminal with standalone transaction
- ✅ Check gateway credentials
- ✅ Verify network connectivity (for online gateways)

**Transaction Declined**
- ✅ Disable test mode for real transactions
- ✅ Verify card is valid (not expired)
- ✅ Check sufficient balance
- ✅ Confirm merchant account active
- ✅ Check gateway service status

**Connection Timeout**
- ✅ Increase timeout setting (default 30s)
- ✅ Check network stability
- ✅ Verify gateway API endpoint
- ✅ Check firewall settings

---

## 🌐 Browser Compatibility

### Web Serial API
| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ | 89+ |
| Edge | ✅ | 89+ |
| Opera | ✅ | 75+ |
| Firefox | ⚠️ | Behind flag |
| Safari | ❌ | Not supported |

### Web Bluetooth API
| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ | 56+ |
| Edge | ✅ | 79+ |
| Opera | ✅ | 43+ |
| Firefox | ⚠️ | Behind flag |
| Safari | ⚠️ | Partial (iOS 16+) |

**Recommendation**: Use **Chrome** or **Edge** for best hardware compatibility.

---

## 🔐 Security Considerations

### USB Device Access
- Browser prompts for permission before accessing USB devices
- User must explicitly allow each device
- Permissions reset on browser restart

### Network Printers
- Ensure printers on trusted network
- Use VPN for remote printer access
- Configure firewall rules for printer ports

### Payment Terminals
- **Never** store card numbers or CVV
- Use tokenization for recurring payments
- Comply with PCI-DSS standards
- Always use HTTPS for gateway communication
- Implement transaction logging

### Data Privacy
- Hardware configuration stored in browser LocalStorage
- Clear browser data to remove device configurations
- No sensitive data transmitted to cloud
- All payment processing via secure gateways

---

## 📚 API Reference

### Hardware Service

```typescript
// Register Device
hardwareService.registerDevice(device: HardwareDevice): void

// Get All Devices
hardwareService.getDevices(): Map<string, HardwareDevice>

// Get Device By ID
hardwareService.getDevice(id: string): HardwareDevice | undefined

// Update Device Status
hardwareService.updateDeviceStatus(
  deviceId: string,
  status: ConnectionStatus
): void

// Test Connection
hardwareService.testConnection(deviceId: string): Promise<boolean>

// Remove Device
hardwareService.removeDevice(deviceId: string): void

// Get Events
hardwareService.getEvents(): Observable<HardwareEvent>
```

### Printer Service

```typescript
// Print Receipt
printerService.printReceipt(
  printerId: string,
  job: PrintJob
): Promise<void>

// Test Print
printerService.testPrint(printerId: string): Promise<void>

// Generate ESC/POS Receipt
printerService.generateESCPOSReceipt(job: PrintJob): Uint8Array

// Open Cash Drawer
printerService.openCashDrawer(printerId: string): Promise<void>
```

### Scanner Service

```typescript
// Start Scanning
scannerService.startScanning(scannerId: string): void

// Stop Scanning
scannerService.stopScanning(scannerId: string): void

// Manual Scan
scannerService.manualScan(
  scannerId: string,
  code: string
): Promise<ScanResult>

// Get Scans
scannerService.getScans(): Observable<ScanResult>

// Validate Checksum
scannerService.validateChecksum(code: string): boolean

// Detect Format
scannerService.detectBarcodeFormat(code: string): BarcodeFormat
```

### Cash Drawer Service

```typescript
// Open Drawer
cashDrawerService.openDrawer(drawerId: string): Promise<void>

// Open For Sale
cashDrawerService.openForSale(
  drawerId: string,
  amount: number
): Promise<void>

// Open For Refund
cashDrawerService.openForRefund(
  drawerId: string,
  amount: number
): Promise<void>

// Link To Printer
cashDrawerService.linkToPrinter(
  drawerId: string,
  printerId: string
): void
```

### Payment Terminal Service

```typescript
// Process Payment
paymentTerminalService.processPayment(
  terminalId: string,
  transaction: PaymentTransaction
): Promise<PaymentTransaction>

// Process NFC Payment
paymentTerminalService.processNFCPayment(
  terminalId: string,
  amount: number
): Promise<PaymentTransaction>

// Refund Payment
paymentTerminalService.refundPayment(
  terminalId: string,
  originalTransactionId: string,
  amount: number
): Promise<PaymentTransaction>

// Validate Card Number
paymentTerminalService.validateCardNumber(
  cardNumber: string
): boolean

// Detect Card Type
paymentTerminalService.detectCardType(
  cardNumber: string
): string
```

---

## 🎨 Receipt Template Customization

### Receipt Template Designer Features
Paradise POS includes a powerful visual receipt template designer accessible at `/hardware/receipt-designer`.

#### Key Features
- ✅ Visual template editor with live preview
- ✅ Multiple template support (create, edit, duplicate, delete)
- ✅ Logo upload and positioning
- ✅ Customizable sections (Header, Items, Totals, Footer)
- ✅ Font size and style customization
- ✅ Text alignment options (left, center, right)
- ✅ Border style selection
- ✅ Paper width configuration (58mm, 80mm)
- ✅ Import/Export templates as JSON
- ✅ Set default template
- ✅ Real-time preview with sample data
- ✅ Print preview functionality

#### Creating a New Template

1. Navigate to `/hardware/receipt-designer`
2. Click **"New Template"** button
3. Configure basic settings:
   - Template name
   - Description
   - Paper width (58mm or 80mm)

4. Customize sections using tabs:

**Header Tab:**
- Enable/disable logo
- Upload logo image
- Business name font size and style
- Show/hide address
- Show/hide contact info (phone, email)
- Header alignment

**Items Tab:**
- Show/hide SKU
- Show/hide quantity
- Show/hide unit price
- Show/hide item total
- Show/hide discount
- Show/hide tax

**Totals Tab:**
- Show/hide subtotal
- Show/hide discount
- Show/hide tax
- Show/hide total
- Show/hide paid amount
- Show/hide change
- Bold total option

**Footer Tab:**
- Show/hide transaction ID
- Show/hide cashier name
- Show/hide date/time
- Custom thank you message
- Terms and conditions

**Styles Tab:**
- Font family (monospace, sans-serif)
- Border style (none, single, double, dashed)
- Section spacing

5. Preview updates in real-time (right panel)
6. Click **"Save Template"** when satisfied

#### Template Management

**Duplicate Template:**
- Select template from left sidebar
- Click menu (⋮) → "Duplicate"
- Modify duplicated template as needed

**Set as Default:**
- Select template
- Click menu (⋮) → "Set as Default"
- This template will be used for all receipts

**Export Template:**
- Select template
- Click menu (⋮) → "Export"
- Downloads template as JSON file

**Import Template:**
- Click menu (⋮) → "Import"
- Select JSON file
- Template added to library

**Delete Template:**
- Select template (cannot delete default)
- Click menu (⋮) → "Delete"
- Confirm deletion

### Example Template Structure
```typescript
interface ReceiptTemplate {
  id: string;
  name: string;
  description?: string;
  paperWidth: 58 | 80; // mm
  sections: {
    header: {
      enabled: boolean;
      logo?: {
        enabled: boolean;
        imageData?: string; // Base64
        width: number;
        height: number;
        alignment: 'left' | 'center' | 'right';
      };
      businessName: {
        enabled: boolean;
        fontSize: 'small' | 'medium' | 'large' | 'xlarge';
        bold: boolean;
      };
      address: {
        enabled: boolean;
        showFullAddress: boolean;
      };
      contact: {
        enabled: boolean;
        showPhone: boolean;
        showEmail: boolean;
      };
      alignment: 'left' | 'center' | 'right';
    };
    items: {
      enabled: boolean;
      showSKU: boolean;
      showQuantity: boolean;
      showUnitPrice: boolean;
      showItemTotal: boolean;
      showDiscount: boolean;
    };
    totals: {
      enabled: boolean;
      showSubtotal: boolean;
      showDiscount: boolean;
      showTax: boolean;
      showTotal: boolean;
      showPaid: boolean;
      showChange: boolean;
      boldTotal: boolean;
      alignment: 'left' | 'right';
    };
    footer: {
      enabled: boolean;
      showTransactionId: boolean;
      showCashier: boolean;
      showDateTime: boolean;
      thankYouMessage?: string;
      alignment: 'left' | 'center' | 'right';
    };
  };
  styles: {
    font: 'monospace' | 'sans-serif';
    borderStyle: 'none' | 'single' | 'double' | 'dashed';
    sectionSpacing: number;
  };
}
```

### Integration with Printer Service

The receipt template designer integrates seamlessly with the printer service:

```typescript
// Get current template
const template = await receiptTemplateService.getCurrentTemplate();

// Generate receipt with template
const receiptText = receiptTemplateService.generateReceiptPreview(
  template,
  {
    businessName: 'My Store',
    items: [...],
    total: 1000,
    // ... other receipt data
  }
);

// Print using printer service
await printerService.printReceipt(printerId, {
  id: 'receipt-1',
  deviceId: printerId,
  content: receiptText,
  // ...
});
```

---

## 📊 Hardware Status Dashboard

### Real-time Monitoring
Access the Hardware Status Dashboard at `/hardware/status` for comprehensive device monitoring.

#### Dashboard Features
- ✅ System health overview (0-100 score)
- ✅ Real-time connection status
- ✅ Device health metrics
- ✅ Operations and error tracking
- ✅ Alert notifications
- ✅ Recent events timeline
- ✅ Auto-refresh (configurable interval)
- ✅ Device uptime tracking
- ✅ Response time monitoring
- ✅ Quick device testing

#### System Health Cards

**Overall System Health:**
- Aggregate health score (0-100%)
- Based on connected devices, errors, and operations
- Color-coded: Green (80%+), Yellow (50-79%), Red (<50%)

**Connected Devices:**
- Shows X / Total devices connected
- Real-time status updates

**Operations:**
- Total operations count
- Across all devices (prints, scans, payments)

**Errors:**
- Total error count
- Highlights problematic devices

#### Device List
Left panel shows all registered devices with:
- Device icon and name
- Device type (PRINTER, SCANNER, etc.)
- Connection status chip
- Health score badge
- Click to view details

#### Device Details Panel
Select a device to view:
- Connection status
- Health score (0-100%)
- Uptime
- Total operations
- Error count
- Response time
- Last activity timestamp
- Quick test button
- Configure device link

#### Alerts Panel
Real-time alerts for:
- **Error Alerts** (Red): Device errors, connection failures
- **Warning Alerts** (Yellow): Disconnected devices, low health scores, high error counts
- **Info Alerts** (Blue): General notifications

Alert actions:
- Acknowledge alert (mark as seen)
- Dismiss alert (remove)
- Clear all alerts

#### Recent Events Timeline
Shows last 30 hardware events:
- Device connected/disconnected
- Print complete
- Scan complete
- Payment complete
- Drawer opened
- Device errors

Color-coded event icons:
- Green: Success events
- Red: Error events
- Blue: Info events

#### Auto-Refresh
- Toggle auto-refresh on/off
- Configurable interval (default: 5 seconds)
- Manual refresh button
- Last updated timestamp

#### Health Score Calculation

Device health score factors:
- Connection status (major factor)
- Error count (reduces score)
- Response time (affects score)
- Uptime (minor factor)

System health score:
- Average of all device health scores
- Weighted by connection status
- Penalized for total errors

---

## 🎨 Receipt Template Designer (Visual Customization)
- Visual drag-and-drop editor
- Custom logo upload
- Adjustable fonts and sizes
- QR code placement
- Custom fields (notes, terms, etc.)
- Multi-language templates
- Preview before print
- Save/load templates

### Example Template Structure
```typescript
interface ReceiptTemplate {
  id: string;
  name: string;
  paperWidth: 58 | 80; // mm
  sections: {
    header: {
      logo?: string; // Base64 image
      businessName: boolean;
      address: boolean;
      phone: boolean;
      customText?: string;
    };
    items: {
      showSKU: boolean;
      showQuantity: boolean;
      showPrice: boolean;
      showDiscount: boolean;
    };
    footer: {
      showBarcode: boolean;
      showQR: boolean;
      customMessage?: string;
      showDateTime: boolean;
    };
  };
  styles: {
    headerAlign: 'left' | 'center' | 'right';
    fontSize: 'small' | 'medium' | 'large';
    boldTotals: boolean;
  };
}
```

---

## 📋 Recommended Hardware

### Budget Setup (Small Retail)
- **Printer**: Epson TM-T20II (~LKR 35,000)
- **Scanner**: Generic USB Barcode Scanner (~LKR 8,000)
- **Cash Drawer**: Standard RJ11 Drawer (~LKR 12,000)
- **Total**: ~LKR 55,000

### Standard Setup (Medium Retail)
- **Printer**: Epson TM-T88V (~LKR 65,000)
- **Scanner**: Honeywell Voyager 1200g (~LKR 25,000)
- **Cash Drawer**: Heavy-duty Metal Drawer (~LKR 20,000)
- **Payment Terminal**: Commercial Bank Terminal (~LKR 45,000)
- **Total**: ~LKR 155,000

### Premium Setup (Large Retail/Supermarket)
- **Printer**: Star TSP650II (~LKR 95,000)
- **Scanner**: Zebra DS2208 (~LKR 45,000)
- **Cash Drawer**: APG Vasario (~LKR 35,000)
- **Payment Terminal**: Multi-gateway Terminal (~LKR 75,000)
- **Customer Display**: VFD Display (~LKR 30,000)
- **Weight Scale**: Digital Scale with Serial (~LKR 50,000)
- **Total**: ~LKR 330,000

---

## 🛠️ Advanced Configuration

### Custom ESC/POS Commands

Create custom printer profiles:

```typescript
const customPrinterConfig: PrinterConfig = {
  type: 'ESC/POS',
  paperWidth: 80,
  characterEncoding: 'utf-8',
  customCommands: {
    // Initialize
    init: [0x1B, 0x40],
    // Center align
    centerAlign: [0x1B, 0x61, 0x01],
    // Cut paper
    cut: [0x1D, 0x56, 0x41, 0x00],
    // Open drawer (custom timing)
    openDrawer: [0x1B, 0x70, 0x00, 0x64, 0xFA] // 100ms pulse
  }
};
```

### Network Printer Discovery

```typescript
// Scan network for ESC/POS printers (port 9100)
async function discoverNetworkPrinters() {
  const subnet = '192.168.1';
  const printers = [];

  for (let i = 1; i <= 254; i++) {
    const ip = `${subnet}.${i}`;
    try {
      await testPort(ip, 9100);
      printers.push(ip);
    } catch (e) {
      // Not a printer
    }
  }

  return printers;
}
```

### Barcode Generation

```typescript
// Generate barcode on receipt
function printBarcodeOnReceipt(
  printer: Printer,
  data: string,
  type: 'EAN13' | 'CODE128' | 'QR'
) {
  let commands: number[] = [];

  if (type === 'EAN13') {
    commands = [
      0x1D, 0x68, 0x64, // Barcode height 100
      0x1D, 0x77, 0x02, // Barcode width
      0x1D, 0x6B, 0x02, // EAN13 type
      ...data.split('').map(c => c.charCodeAt(0)),
      0x00 // Null terminator
    ];
  }

  printer.send(commands);
}
```

---

## 📞 Support

### Hardware Issues
- Email: hardware-support@paradisepos.com
- Phone: +94 11 234 5678
- Hours: 9 AM - 6 PM (Mon-Fri)

### Payment Gateway Support
- Commercial Bank: 1588 (24/7)
- Sampath Bank: 011-2301301
- HNB: 011-2448448
- PayHere: support@payhere.lk

### Community
- GitHub Issues: [github.com/paradise-pos/pos-fe/issues](https://github.com/paradise-pos/pos-fe/issues)
- Developer Forum: [forum.paradisepos.com](https://forum.paradisepos.com)

---

## 📝 Change Log

### Version 1.0.0 (Current)
- ✅ Receipt Printer Service (ESC/POS)
- ✅ Barcode Scanner Service
- ✅ Cash Drawer Service
- ✅ Payment Terminal Service
- ✅ Hardware Configuration UI
- ✅ Real-time Status Monitoring
- ✅ Event Logging
- ✅ 8 Sri Lankan Payment Gateways
- ✅ Hardware Status Dashboard
- ✅ Receipt Template Designer

### Upcoming (v1.1.0)
- 🔜 Customer Display Service
- 🔜 Weight Scale Service
- 🔜 Cloud-based device management
- 🔜 Remote printer access
- 🔜 Advanced analytics
- 🔜 Device usage reports

---

**Documentation Version**: 1.0.0
**Last Updated**: November 10, 2025
**Maintained By**: Paradise POS Development Team

