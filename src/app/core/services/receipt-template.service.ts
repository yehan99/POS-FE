import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ReceiptTemplate,
  DEFAULT_RECEIPT_TEMPLATE,
  ReceiptPreviewData,
  SAMPLE_RECEIPT_DATA,
} from '../models/receipt-template.model';

@Injectable({
  providedIn: 'root',
})
export class ReceiptTemplateService {
  private templates$ = new BehaviorSubject<ReceiptTemplate[]>([]);
  private currentTemplate$ = new BehaviorSubject<ReceiptTemplate | null>(null);
  private readonly STORAGE_KEY = 'pos_receipt_templates';
  private readonly CURRENT_TEMPLATE_KEY = 'pos_current_template';

  constructor() {
    this.loadTemplatesFromStorage();
  }

  /**
   * Load templates from localStorage
   */
  private loadTemplatesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const templates = JSON.parse(stored, this.dateReviver);
        this.templates$.next(templates);
      } else {
        // Initialize with default template
        this.templates$.next([DEFAULT_RECEIPT_TEMPLATE]);
        this.saveTemplatesToStorage();
      }

      // Load current template
      const currentId = localStorage.getItem(this.CURRENT_TEMPLATE_KEY);
      if (currentId) {
        const current = this.templates$.value.find((t) => t.id === currentId);
        if (current) {
          this.currentTemplate$.next(current);
        }
      }
    } catch (error) {
      console.error('Failed to load templates from storage:', error);
      this.templates$.next([DEFAULT_RECEIPT_TEMPLATE]);
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveTemplatesToStorage(): void {
    try {
      const templates = this.templates$.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  }

  /**
   * Date reviver for JSON.parse
   */
  private dateReviver(key: string, value: any): any {
    if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') {
      return new Date(value);
    }
    return value;
  }

  /**
   * Get all templates
   */
  getTemplates(): Observable<ReceiptTemplate[]> {
    return this.templates$.asObservable();
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ReceiptTemplate | undefined {
    return this.templates$.value.find((t) => t.id === id);
  }

  /**
   * Get current active template
   */
  getCurrentTemplate(): Observable<ReceiptTemplate | null> {
    return this.currentTemplate$.asObservable();
  }

  /**
   * Set current active template
   */
  setCurrentTemplate(templateId: string): void {
    const template = this.getTemplate(templateId);
    if (template) {
      this.currentTemplate$.next(template);
      localStorage.setItem(this.CURRENT_TEMPLATE_KEY, templateId);
    }
  }

  /**
   * Create new template
   */
  createTemplate(
    template: Omit<ReceiptTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): ReceiptTemplate {
    const newTemplate: ReceiptTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const templates = this.templates$.value;
    templates.push(newTemplate);
    this.templates$.next([...templates]);
    this.saveTemplatesToStorage();

    return newTemplate;
  }

  /**
   * Update existing template
   */
  updateTemplate(
    id: string,
    updates: Partial<ReceiptTemplate>
  ): ReceiptTemplate | null {
    const templates = this.templates$.value;
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    const updatedTemplate = {
      ...templates[index],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
    };

    templates[index] = updatedTemplate;
    this.templates$.next([...templates]);
    this.saveTemplatesToStorage();

    // Update current template if it was updated
    if (this.currentTemplate$.value?.id === id) {
      this.currentTemplate$.next(updatedTemplate);
    }

    return updatedTemplate;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const templates = this.templates$.value;
    const template = templates.find((t) => t.id === id);

    // Cannot delete default template
    if (template?.isDefault) {
      return false;
    }

    const filtered = templates.filter((t) => t.id !== id);
    this.templates$.next(filtered);
    this.saveTemplatesToStorage();

    // If deleted template was current, set default
    if (this.currentTemplate$.value?.id === id) {
      const defaultTemplate = filtered.find((t) => t.isDefault) || filtered[0];
      if (defaultTemplate) {
        this.setCurrentTemplate(defaultTemplate.id);
      }
    }

    return true;
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(id: string): ReceiptTemplate | null {
    const original = this.getTemplate(id);
    if (!original) {
      return null;
    }

    const duplicate = this.createTemplate({
      ...original,
      name: `${original.name} (Copy)`,
      isDefault: false,
    });

    return duplicate;
  }

  /**
   * Generate receipt preview text
   */
  generateReceiptPreview(
    template: ReceiptTemplate,
    data: ReceiptPreviewData = SAMPLE_RECEIPT_DATA
  ): string {
    let output = '';
    const width = template.paperWidth === 80 ? 48 : 32; // Characters per line

    // Helper functions
    const centerText = (text: string): string => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const rightAlign = (text: string): string => {
      const padding = Math.max(0, width - text.length);
      return ' '.repeat(padding) + text;
    };

    const addLine = (
      text: string = '',
      align: 'left' | 'center' | 'right' = 'left'
    ): void => {
      if (align === 'center') {
        output += centerText(text) + '\n';
      } else if (align === 'right') {
        output += rightAlign(text) + '\n';
      } else {
        output += text + '\n';
      }
    };

    const addSeparator = (style: string = 'single'): void => {
      const char = style === 'double' ? '=' : style === 'dashed' ? '-' : '-';
      addLine(char.repeat(width));
    };

    const addSpacing = (lines: number = 1): void => {
      output += '\n'.repeat(lines);
    };

    // Header Section
    if (template.sections.header.enabled) {
      if (
        template.sections.header.logo?.enabled &&
        template.sections.header.logo.imageData
      ) {
        addLine('[LOGO]', template.sections.header.logo.alignment);
        addSpacing();
      }

      if (template.sections.header.businessName.enabled) {
        const name =
          template.sections.header.businessName.text || data.businessName;
        addLine(name, template.sections.header.alignment);
      }

      if (template.sections.header.address.enabled) {
        const address =
          template.sections.header.address.text || data.businessAddress;
        addLine(address, template.sections.header.alignment);
      }

      if (template.sections.header.contact.enabled) {
        const contact = template.sections.header.contact;
        if (contact.showPhone)
          addLine(
            `Tel: ${data.businessPhone}`,
            template.sections.header.alignment
          );
        if (contact.showEmail)
          addLine(
            `Email: ${data.businessEmail}`,
            template.sections.header.alignment
          );
      }

      if (template.sections.header.customText?.enabled) {
        addSpacing();
        addLine(
          template.sections.header.customText.text,
          template.sections.header.customText.alignment
        );
      }

      addSpacing(template.styles.sectionSpacing);
      addSeparator(template.styles.borderStyle);
    }

    // Items Section
    if (template.sections.items.enabled) {
      addSpacing();

      data.items.forEach((item) => {
        let itemLine = '';

        if (template.sections.items.showQuantity) {
          itemLine += `${item.quantity}x `;
        }

        itemLine += item.name;

        if (template.sections.items.showItemTotal) {
          const total = `LKR ${item.total.toFixed(2)}`;
          const padding = width - itemLine.length - total.length;
          itemLine += ' '.repeat(Math.max(1, padding)) + total;
        }

        addLine(itemLine);

        // Show unit price and discount on second line if needed
        if (
          template.sections.items.showUnitPrice ||
          template.sections.items.showDiscount
        ) {
          let detailLine = '  ';
          if (template.sections.items.showUnitPrice) {
            detailLine += `@ LKR ${item.unitPrice.toFixed(2)}`;
          }
          if (
            template.sections.items.showDiscount &&
            item.discount &&
            item.discount > 0
          ) {
            detailLine += ` (Disc: LKR ${item.discount.toFixed(2)})`;
          }
          addLine(detailLine);
        }
      });

      addSpacing(template.styles.sectionSpacing);
      addSeparator(template.styles.borderStyle);
    }

    // Totals Section
    if (template.sections.totals.enabled) {
      addSpacing();

      const addTotal = (
        label: string,
        amount: number,
        bold: boolean = false
      ): void => {
        const amountStr = `LKR ${amount.toFixed(2)}`;
        const line = `${label}${' '.repeat(
          width - label.length - amountStr.length
        )}${amountStr}`;
        addLine(
          bold ? `**${line}**` : line,
          template.sections.totals.alignment
        );
      };

      if (template.sections.totals.showSubtotal) {
        addTotal('Subtotal:', data.subtotal);
      }
      if (template.sections.totals.showDiscount && data.discount > 0) {
        addTotal('Discount:', -data.discount);
      }
      if (template.sections.totals.showTax && data.tax > 0) {
        addTotal('Tax:', data.tax);
      }

      if (template.sections.totals.showTotal) {
        addSeparator(template.styles.borderStyle);
        addTotal('TOTAL:', data.total, template.sections.totals.boldTotal);
      }

      if (template.sections.totals.showPaid) {
        addSpacing();
        addTotal('Paid:', data.paid);
      }
      if (template.sections.totals.showChange) {
        addTotal('Change:', data.change);
      }

      addSpacing(template.styles.sectionSpacing);
      addSeparator(template.styles.borderStyle);
    }

    // Footer Section
    if (template.sections.footer.enabled) {
      addSpacing();

      if (template.sections.footer.showTransactionId) {
        addLine(
          `Transaction: ${data.transactionId}`,
          template.sections.footer.alignment
        );
      }
      if (template.sections.footer.showCashier) {
        addLine(`Cashier: ${data.cashier}`, template.sections.footer.alignment);
      }
      if (template.sections.footer.showDateTime) {
        addLine(
          `Date: ${data.timestamp.toLocaleString()}`,
          template.sections.footer.alignment
        );
      }

      if (template.sections.footer.customMessage?.enabled) {
        addSpacing();
        addLine(
          template.sections.footer.customMessage.text,
          template.sections.footer.alignment
        );
      }

      if (template.sections.footer.thankYouMessage) {
        addSpacing();
        addLine(
          template.sections.footer.thankYouMessage,
          template.sections.footer.alignment
        );
      }

      if (template.sections.footer.barcode?.enabled) {
        addSpacing();
        addLine('[BARCODE]', 'center');
      }

      if (template.sections.footer.qrCode?.enabled) {
        addSpacing();
        addLine('[QR CODE]', 'center');
      }

      if (template.sections.footer.termsAndConditions) {
        addSpacing();
        addSeparator('dashed');
        addLine(template.sections.footer.termsAndConditions, 'center');
      }
    }

    return output;
  }

  /**
   * Export template to JSON
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) {
      return null;
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(jsonString: string): ReceiptTemplate | null {
    try {
      const template = JSON.parse(jsonString, this.dateReviver);
      // Generate new ID to avoid conflicts
      template.id = this.generateId();
      template.createdAt = new Date();
      template.updatedAt = new Date();
      template.isDefault = false;

      const templates = this.templates$.value;
      templates.push(template);
      this.templates$.next([...templates]);
      this.saveTemplatesToStorage();

      return template;
    } catch (error) {
      console.error('Failed to import template:', error);
      return null;
    }
  }

  /**
   * Reset to default template
   */
  resetToDefault(): void {
    this.templates$.next([DEFAULT_RECEIPT_TEMPLATE]);
    this.currentTemplate$.next(DEFAULT_RECEIPT_TEMPLATE);
    this.saveTemplatesToStorage();
    localStorage.setItem(
      this.CURRENT_TEMPLATE_KEY,
      DEFAULT_RECEIPT_TEMPLATE.id
    );
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
