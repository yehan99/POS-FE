import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ReceiptTemplateService } from '../../../core/services/receipt-template.service';
import {
  ReceiptTemplate,
  DEFAULT_RECEIPT_TEMPLATE,
  SAMPLE_RECEIPT_DATA,
  ReceiptPreviewData,
} from '../../../core/models/receipt-template.model';

@Component({
  selector: 'app-receipt-designer',
  standalone: false,
  templateUrl: './receipt-designer.component.html',
  styleUrl: './receipt-designer.component.scss',
})
export class ReceiptDesignerComponent implements OnInit, OnDestroy {
  // Templates
  templates: ReceiptTemplate[] = [];
  selectedTemplate: ReceiptTemplate | null = null;
  workingTemplate: ReceiptTemplate | null = null;
  isEditing = false;
  isNewTemplate = false;

  // Preview
  previewText = '';
  previewData: ReceiptPreviewData = SAMPLE_RECEIPT_DATA;
  autoPreview = true;

  // UI State
  selectedTab = 0; // 0: Header, 1: Items, 2: Totals, 3: Footer, 4: Styles
  hasUnsavedChanges = false;

  // Paper widths
  paperWidths = [
    { value: 58, label: '58mm (Small)' },
    { value: 80, label: '80mm (Standard)' },
  ];

  // Font sizes
  fontSizes = ['small', 'medium', 'large', 'xlarge'];

  // Alignments
  alignments = ['left', 'center', 'right'];

  // Border styles
  borderStyles = [
    { value: 'none', label: 'None' },
    { value: 'single', label: 'Single Line' },
    { value: 'double', label: 'Double Line' },
    { value: 'dashed', label: 'Dashed' },
  ];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private receiptTemplateService: ReceiptTemplateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.subscribeToTemplates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadTemplates(): void {
    this.subscriptions.push(
      this.receiptTemplateService.getTemplates().subscribe((templates) => {
        this.templates = templates;
        if (!this.selectedTemplate && templates.length > 0) {
          this.selectTemplate(templates[0]);
        }
      })
    );
  }

  private subscribeToTemplates(): void {
    this.subscriptions.push(
      this.receiptTemplateService.getCurrentTemplate().subscribe((template) => {
        // Current template updated
      })
    );
  }

  selectTemplate(template: ReceiptTemplate): void {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Continue?');
      if (!confirmed) return;
    }

    this.selectedTemplate = template;
    this.workingTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
    this.isEditing = false;
    this.isNewTemplate = false;
    this.hasUnsavedChanges = false;
    this.updatePreview();
  }

  startEditing(): void {
    if (!this.selectedTemplate) return;
    this.isEditing = true;
    this.workingTemplate = JSON.parse(JSON.stringify(this.selectedTemplate));
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.workingTemplate = this.selectedTemplate
      ? JSON.parse(JSON.stringify(this.selectedTemplate))
      : null;
    this.hasUnsavedChanges = false;
  }

  saveTemplate(): void {
    if (!this.workingTemplate) return;

    if (this.isNewTemplate) {
      const created = this.receiptTemplateService.createTemplate({
        name: this.workingTemplate.name,
        description: this.workingTemplate.description,
        paperWidth: this.workingTemplate.paperWidth,
        sections: this.workingTemplate.sections,
        styles: this.workingTemplate.styles,
        isDefault: false,
      });
      this.selectedTemplate = created;
      this.isNewTemplate = false;
      this.showSuccess('Template created successfully');
    } else if (this.selectedTemplate) {
      const updated = this.receiptTemplateService.updateTemplate(
        this.selectedTemplate.id,
        this.workingTemplate
      );
      if (updated) {
        this.selectedTemplate = updated;
        this.showSuccess('Template updated successfully');
      }
    }

    this.isEditing = false;
    this.hasUnsavedChanges = false;
    this.updatePreview();
  }

  createNewTemplate(): void {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Continue?');
      if (!confirmed) return;
    }

    this.isNewTemplate = true;
    this.isEditing = true;
    this.workingTemplate = JSON.parse(JSON.stringify(DEFAULT_RECEIPT_TEMPLATE));
    this.workingTemplate!.id = 'new';
    this.workingTemplate!.name = 'New Template';
    this.workingTemplate!.isDefault = false;
    this.selectedTemplate = null;
    this.hasUnsavedChanges = true;
  }

  duplicateTemplate(): void {
    if (!this.selectedTemplate) return;

    const duplicated = this.receiptTemplateService.duplicateTemplate(
      this.selectedTemplate.id
    );
    if (duplicated) {
      this.selectTemplate(duplicated);
      this.showSuccess('Template duplicated successfully');
    }
  }

  deleteTemplate(): void {
    if (!this.selectedTemplate) return;

    if (this.selectedTemplate.isDefault) {
      this.showError('Cannot delete default template');
      return;
    }

    const confirmed = confirm(
      `Delete template "${this.selectedTemplate.name}"?`
    );
    if (!confirmed) return;

    const success = this.receiptTemplateService.deleteTemplate(
      this.selectedTemplate.id
    );
    if (success) {
      this.selectedTemplate = null;
      this.workingTemplate = null;
      this.showSuccess('Template deleted successfully');
    }
  }

  exportTemplate(): void {
    if (!this.selectedTemplate) return;

    const json = this.receiptTemplateService.exportTemplate(
      this.selectedTemplate.id
    );
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.selectedTemplate.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess('Template exported successfully');
    }
  }

  importTemplate(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const json = e.target?.result as string;
      const imported = this.receiptTemplateService.importTemplate(json);
      if (imported) {
        this.selectTemplate(imported);
        this.showSuccess('Template imported successfully');
      } else {
        this.showError('Failed to import template');
      }
    };

    reader.readAsText(file);
  }

  setAsDefault(): void {
    if (!this.selectedTemplate) return;

    // Remove default flag from all templates
    this.templates.forEach((t) => {
      if (t.isDefault) {
        this.receiptTemplateService.updateTemplate(t.id, { isDefault: false });
      }
    });

    // Set current as default
    this.receiptTemplateService.updateTemplate(this.selectedTemplate.id, {
      isDefault: true,
    });

    this.showSuccess('Default template updated');
  }

  onTemplateChange(): void {
    this.hasUnsavedChanges = true;
    if (this.autoPreview) {
      this.updatePreview();
    }
  }

  updatePreview(): void {
    if (this.workingTemplate) {
      this.previewText = this.receiptTemplateService.generateReceiptPreview(
        this.workingTemplate,
        this.previewData
      );
    }
  }

  toggleAutoPreview(): void {
    this.autoPreview = !this.autoPreview;
    if (this.autoPreview) {
      this.updatePreview();
    }
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.showError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      if (this.workingTemplate) {
        this.workingTemplate.sections.header.logo = {
          enabled: true,
          imageData,
          width: 200,
          height: 80,
          alignment: 'center',
        };
        this.onTemplateChange();
      }
    };

    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    if (this.workingTemplate?.sections.header.logo) {
      this.workingTemplate.sections.header.logo.enabled = false;
      this.workingTemplate.sections.header.logo.imageData = undefined;
      this.onTemplateChange();
    }
  }

  printPreview(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt Preview</title>
            <style>
              body { font-family: monospace; white-space: pre; }
            </style>
          </head>
          <body>${this.previewText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  getDefaultTemplateCount(): number {
    return this.templates.filter((t) => t.isDefault).length;
  }

  goBack(): void {
    this.location.back();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'success-snackbar',
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  }
}
