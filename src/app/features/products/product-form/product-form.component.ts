import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { Product, ProductCategory, TaxClass } from '../../../core/models';
import { ProductManagementService } from '../services/product-management.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  productId: string | null = null;

  categories: ProductCategory[] = [];
  taxClasses: TaxClass[] = [
    {
      id: '1',
      name: 'Standard Tax (15%)',
      rate: 15,
      type: 'PERCENTAGE' as any,
      isActive: true,
    },
    {
      id: '2',
      name: 'Reduced Tax (8%)',
      rate: 8,
      type: 'PERCENTAGE' as any,
      isActive: true,
    },
    {
      id: '3',
      name: 'Zero Tax (0%)',
      rate: 0,
      type: 'PERCENTAGE' as any,
      isActive: true,
    },
  ];

  selectedImages: string[] = [];
  imageFiles: File[] = [];

  // Attribute types for dynamic attributes
  attributeTypes = ['text', 'number', 'boolean', 'select'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductManagementService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();

    // Check if editing existing product
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    } else {
      // Generate SKU for new product
      this.generateSKU();
    }

    // Listen to category changes to auto-generate SKU
    this.productForm.get('category')?.valueChanges.subscribe(() => {
      if (!this.isEditMode) {
        this.generateSKU();
      }
    });

    // Listen to trackInventory changes
    this.productForm.get('trackInventory')?.valueChanges.subscribe((track) => {
      if (track) {
        this.productForm.get('stockQuantity')?.enable();
        this.productForm.get('reorderLevel')?.enable();
        this.productForm.get('maxStockLevel')?.enable();
      } else {
        this.productForm.get('stockQuantity')?.disable();
        this.productForm.get('reorderLevel')?.disable();
        this.productForm.get('maxStockLevel')?.disable();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200),
        ],
      ],
      description: [''],
      category: ['', Validators.required],
      brand: [''],
      barcode: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.min(0)]],
      taxClass: ['1', Validators.required],
      isActive: [true],
      trackInventory: [true],
      stockQuantity: [0, [Validators.min(0)]],
      reorderLevel: [10, [Validators.min(0)]],
      maxStockLevel: [1000, [Validators.min(0)]],
      weight: [0, [Validators.min(0)]],
      tags: [[]],
      attributes: this.fb.array([]),
    });
  }

  get attributes(): FormArray {
    return this.productForm.get('attributes') as FormArray;
  }

  addAttribute(): void {
    const attributeGroup = this.fb.group({
      name: ['', Validators.required],
      value: ['', Validators.required],
      type: ['text', Validators.required],
    });
    this.attributes.push(attributeGroup);
  }

  removeAttribute(index: number): void {
    this.attributes.removeAt(index);
  }

  loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showSnackBar('Failed to load categories', 'error');
      },
    });
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.showSnackBar('Failed to load product', 'error');
        this.isLoading = false;
        this.router.navigate(['/products']);
      },
    });
  }

  populateForm(product: Product): void {
    this.selectedImages = [...product.images];

    this.productForm.patchValue({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category.id,
      brand: product.brand,
      barcode: product.barcode,
      price: product.price,
      costPrice: product.costPrice,
      taxClass: product.taxClass.id,
      isActive: product.isActive,
      trackInventory: product.trackInventory,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      weight: product.weight,
      tags: product.tags,
    });

    // Populate attributes
    if (product.attributes && product.attributes.length > 0) {
      product.attributes.forEach((attr) => {
        const attributeGroup = this.fb.group({
          name: [attr.name, Validators.required],
          value: [attr.value, Validators.required],
          type: [attr.type, Validators.required],
        });
        this.attributes.push(attributeGroup);
      });
    }
  }

  generateSKU(): void {
    const categoryId = this.productForm.get('category')?.value;
    this.productService.generateSKU(categoryId).subscribe({
      next: (sku) => {
        this.productForm.patchValue({ sku });
      },
      error: (error) => {
        console.error('Error generating SKU:', error);
      },
    });
  }

  generateBarcode(): void {
    this.productService.generateBarcode().subscribe({
      next: (barcode) => {
        this.productForm.patchValue({ barcode });
        this.showSnackBar('Barcode generated successfully', 'success');
      },
      error: (error) => {
        console.error('Error generating barcode:', error);
        this.showSnackBar('Failed to generate barcode', 'error');
      },
    });
  }

  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          this.imageFiles.push(file);

          // Create preview
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.selectedImages.push(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    if (index < this.imageFiles.length) {
      this.imageFiles.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.showSnackBar(
        'Please fill in all required fields correctly',
        'error'
      );
      return;
    }

    this.isSaving = true;
    const formValue = this.productForm.getRawValue();

    // Find category object
    const category = this.categories.find((c) => c.id === formValue.category);
    const taxClass = this.taxClasses.find((t) => t.id === formValue.taxClass);

    const productData: Partial<Product> = {
      sku: formValue.sku,
      name: formValue.name,
      description: formValue.description,
      category: category!,
      brand: formValue.brand,
      barcode: formValue.barcode,
      price: formValue.price,
      costPrice: formValue.costPrice,
      taxClass: taxClass!,
      isActive: formValue.isActive,
      trackInventory: formValue.trackInventory,
      stockQuantity: formValue.stockQuantity || 0,
      reorderLevel: formValue.reorderLevel,
      maxStockLevel: formValue.maxStockLevel,
      weight: formValue.weight,
      tags: formValue.tags || [],
      attributes: formValue.attributes || [],
      images: this.selectedImages,
      variants: [],
      tenantId: 'TENANT001', // TODO: Get from auth service
    };

    const operation = this.isEditMode
      ? this.productService.updateProduct(this.productId!, productData)
      : this.productService.createProduct(productData);

    operation.subscribe({
      next: (product) => {
        // Upload new images if any
        if (this.imageFiles.length > 0) {
          this.uploadImages(product.id);
        } else {
          this.onSaveSuccess();
        }
      },
      error: (error) => {
        console.error('Error saving product:', error);
        this.showSnackBar(
          `Failed to ${this.isEditMode ? 'update' : 'create'} product`,
          'error'
        );
        this.isSaving = false;
      },
    });
  }

  uploadImages(productId: string): void {
    let uploadedCount = 0;
    this.imageFiles.forEach((file, index) => {
      this.productService.uploadProductImage(productId, file).subscribe({
        next: (imageUrl) => {
          uploadedCount++;
          if (uploadedCount === this.imageFiles.length) {
            this.onSaveSuccess();
          }
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          uploadedCount++;
          if (uploadedCount === this.imageFiles.length) {
            this.onSaveSuccess();
          }
        },
      });
    });
  }

  onSaveSuccess(): void {
    this.showSnackBar(
      `Product ${this.isEditMode ? 'updated' : 'created'} successfully`,
      'success'
    );
    this.isSaving = false;
    this.router.navigate(['/products']);
  }

  cancel(): void {
    if (
      confirm(
        'Are you sure you want to cancel? Any unsaved changes will be lost.'
      )
    ) {
      this.router.navigate(['/products']);
    }
  }

  // Validation helpers
  hasError(controlName: string, errorName: string): boolean {
    const control = this.productForm.get(controlName);
    return control ? control.hasError(errorName) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength}`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength}`;
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('pattern')) {
      return 'Invalid format';
    }
    return '';
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentTags = this.productForm.get('tags')?.value || [];
      if (!currentTags.includes(value)) {
        this.productForm.patchValue({ tags: [...currentTags, value] });
      }
    }
    event.chipInput?.clear();
  }

  removeTag(tag: string): void {
    const currentTags = this.productForm.get('tags')?.value || [];
    const index = currentTags.indexOf(tag);
    if (index >= 0) {
      currentTags.splice(index, 1);
      this.productForm.patchValue({ tags: [...currentTags] });
    }
  }

  private showSnackBar(
    message: string,
    type: 'success' | 'error' | 'warning'
  ): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`],
    });
  }
}
