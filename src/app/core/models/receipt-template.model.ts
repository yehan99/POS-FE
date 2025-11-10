// Receipt template interfaces

export interface ReceiptTemplate {
  id: string;
  name: string;
  description?: string;
  paperWidth: 58 | 80; // mm
  sections: ReceiptSections;
  styles: ReceiptStyles;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface ReceiptSections {
  header: HeaderSection;
  items: ItemsSection;
  totals: TotalsSection;
  footer: FooterSection;
}

export interface HeaderSection {
  enabled: boolean;
  logo?: LogoConfig;
  businessName: BusinessNameConfig;
  address: AddressConfig;
  contact: ContactConfig;
  customText?: CustomTextConfig;
  alignment: 'left' | 'center' | 'right';
}

export interface LogoConfig {
  enabled: boolean;
  imageData?: string; // Base64 image data
  width: number; // pixels
  height: number; // pixels
  alignment: 'left' | 'center' | 'right';
}

export interface BusinessNameConfig {
  enabled: boolean;
  text?: string; // If empty, uses business info from settings
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  bold: boolean;
}

export interface AddressConfig {
  enabled: boolean;
  text?: string; // If empty, uses business info from settings
  fontSize: 'small' | 'medium' | 'large';
  showFullAddress: boolean;
}

export interface ContactConfig {
  enabled: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  fontSize: 'small' | 'medium';
}

export interface CustomTextConfig {
  enabled: boolean;
  text: string;
  fontSize: 'small' | 'medium' | 'large';
  bold: boolean;
  alignment: 'left' | 'center' | 'right';
}

export interface ItemsSection {
  enabled: boolean;
  showSKU: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showItemTotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  columnSeparator: string; // e.g., ' | ', '  ', '\t'
  fontSize: 'small' | 'medium';
}

export interface TotalsSection {
  enabled: boolean;
  showSubtotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showTotal: boolean;
  showPaid: boolean;
  showChange: boolean;
  boldTotal: boolean;
  fontSize: 'small' | 'medium' | 'large';
  alignment: 'left' | 'right';
}

export interface FooterSection {
  enabled: boolean;
  barcode?: BarcodeConfig;
  qrCode?: QRCodeConfig;
  customMessage?: CustomMessageConfig;
  showDateTime: boolean;
  showCashier: boolean;
  showTransactionId: boolean;
  thankYouMessage?: string;
  termsAndConditions?: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: 'small' | 'medium';
}

export interface BarcodeConfig {
  enabled: boolean;
  type: 'CODE128' | 'EAN13' | 'UPC';
  data: 'transaction_id' | 'custom'; // What to encode
  customData?: string;
  height: number; // pixels
  width: number; // Module width
  showText: boolean;
}

export interface QRCodeConfig {
  enabled: boolean;
  data: 'transaction_url' | 'business_info' | 'custom';
  customData?: string;
  size: number; // pixels
  errorCorrection: 'L' | 'M' | 'Q' | 'H'; // Low, Medium, Quartile, High
}

export interface CustomMessageConfig {
  enabled: boolean;
  text: string;
  fontSize: 'small' | 'medium' | 'large';
  bold: boolean;
}

export interface ReceiptStyles {
  font: 'monospace' | 'sans-serif';
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  sectionSpacing: number; // Lines between sections
  borderStyle: 'none' | 'single' | 'double' | 'dashed';
  characterEncoding: 'utf-8' | 'iso-8859-1' | 'windows-1252';
}

// Receipt preview data
export interface ReceiptPreviewData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  transactionId: string;
  cashier: string;
  timestamp: Date;
}

export interface ReceiptItem {
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}

// Default template
export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
  id: 'default',
  name: 'Default Receipt Template',
  description: 'Standard receipt template',
  paperWidth: 80,
  sections: {
    header: {
      enabled: true,
      logo: {
        enabled: false,
        width: 200,
        height: 80,
        alignment: 'center',
      },
      businessName: {
        enabled: true,
        fontSize: 'large',
        bold: true,
      },
      address: {
        enabled: true,
        fontSize: 'small',
        showFullAddress: true,
      },
      contact: {
        enabled: true,
        showPhone: true,
        showEmail: true,
        showWebsite: false,
        fontSize: 'small',
      },
      alignment: 'center',
    },
    items: {
      enabled: true,
      showSKU: false,
      showQuantity: true,
      showUnitPrice: true,
      showItemTotal: true,
      showDiscount: true,
      showTax: false,
      columnSeparator: '  ',
      fontSize: 'small',
    },
    totals: {
      enabled: true,
      showSubtotal: true,
      showDiscount: true,
      showTax: true,
      showTotal: true,
      showPaid: true,
      showChange: true,
      boldTotal: true,
      fontSize: 'medium',
      alignment: 'right',
    },
    footer: {
      enabled: true,
      barcode: {
        enabled: false,
        type: 'CODE128',
        data: 'transaction_id',
        height: 50,
        width: 2,
        showText: true,
      },
      qrCode: {
        enabled: false,
        data: 'transaction_url',
        size: 100,
        errorCorrection: 'M',
      },
      customMessage: {
        enabled: true,
        text: 'Thank you for your business!',
        fontSize: 'medium',
        bold: false,
      },
      showDateTime: true,
      showCashier: true,
      showTransactionId: true,
      thankYouMessage: 'Thank you for shopping with us!',
      alignment: 'center',
      fontSize: 'small',
    },
  },
  styles: {
    font: 'monospace',
    lineSpacing: 'normal',
    sectionSpacing: 1,
    borderStyle: 'single',
    characterEncoding: 'utf-8',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isDefault: true,
};

// Sample preview data
export const SAMPLE_RECEIPT_DATA: ReceiptPreviewData = {
  businessName: 'Paradise POS Store',
  businessAddress: '123 Main Street, Colombo 00700, Sri Lanka',
  businessPhone: '+94 11 234 5678',
  businessEmail: 'info@paradisepos.com',
  items: [
    {
      sku: 'PROD-001',
      name: 'Product A',
      quantity: 2,
      unitPrice: 500,
      discount: 50,
      tax: 95,
      total: 1045,
    },
    {
      sku: 'PROD-002',
      name: 'Product B with a longer name',
      quantity: 1,
      unitPrice: 1500,
      discount: 0,
      tax: 150,
      total: 1650,
    },
    {
      sku: 'PROD-003',
      name: 'Product C',
      quantity: 3,
      unitPrice: 200,
      discount: 30,
      tax: 57,
      total: 627,
    },
  ],
  subtotal: 3200,
  discount: 80,
  tax: 302,
  total: 3422,
  paid: 5000,
  change: 1578,
  transactionId: 'TXN-20241110-001',
  cashier: 'John Doe',
  timestamp: new Date(),
};
