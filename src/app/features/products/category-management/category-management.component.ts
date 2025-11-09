import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductCategory } from '../../../core/models';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-category-management',
  standalone: false,
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss',
})
export class CategoryManagementComponent implements OnInit {
  categories: ProductCategory[] = [];
  isLoading = false;
  isEditing = false;
  editingCategory: ProductCategory | null = null;

  categoryForm: FormGroup;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: [''],
      sortOrder: [0, [Validators.min(0)]],
      isActive: [true],
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.loadCategories().subscribe({
      next: (categories) => {
        this.categories = categories.sort((a, b) => a.sortOrder - b.sortOrder);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showSnackBar('Failed to load categories', 'error');
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData: Partial<ProductCategory> = {
      ...this.categoryForm.value,
      tenantId: 'TENANT001', // TODO: Get from auth service
    };

    const operation =
      this.isEditing && this.editingCategory
        ? this.categoryService.updateCategory(
            this.editingCategory.id,
            categoryData
          )
        : this.categoryService.createCategory(categoryData);

    operation.subscribe({
      next: () => {
        this.showSnackBar(
          `Category ${this.isEditing ? 'updated' : 'created'} successfully`,
          'success'
        );
        this.resetForm();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.showSnackBar(
          `Failed to ${this.isEditing ? 'update' : 'create'} category`,
          'error'
        );
      },
    });
  }

  editCategory(category: ProductCategory): void {
    this.isEditing = true;
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  }

  deleteCategory(category: ProductCategory): void {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.showSnackBar('Category deleted successfully', 'success');
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.showSnackBar('Failed to delete category', 'error');
        },
      });
    }
  }

  toggleStatus(category: ProductCategory): void {
    this.categoryService
      .updateCategory(category.id, { isActive: !category.isActive })
      .subscribe({
        next: () => {
          this.showSnackBar(
            `Category ${category.isActive ? 'deactivated' : 'activated'}`,
            'success'
          );
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category status:', error);
          this.showSnackBar('Failed to update category status', 'error');
        },
      });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`],
    });
  }
}
