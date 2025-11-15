import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ProductCategory } from '../../../core/models';
import {
  CategoryService,
  CategoryMetrics,
  CategoryListResponse,
} from '../services/category.service';
import { finalize } from 'rxjs/operators';

type CategoryPageOptions = {
  pageIndex?: number;
  pageSize?: number;
};

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
  isSaving = false;
  editingCategory: ProductCategory | null = null;
  categoryMetrics: CategoryMetrics = {
    total: 0,
    active: 0,
    inactive: 0,
    nextSortOrder: 1,
  };
  totalCategories = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [10, 20, 50];
  pagination: CategoryListResponse['pagination'] | null = null;
  lastUpdated: Date | null = null;
  private statusUpdatingIds: Set<string> = new Set();

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

  loadCategories(options: CategoryPageOptions = {}, force = false): void {
    if (this.isLoading && !force) {
      return;
    }

    this.isLoading = true;

    const targetPageIndex = options.pageIndex ?? this.pageIndex;
    const targetPageSize = options.pageSize ?? this.pageSize;

    this.categoryService
      .loadCategories({
        page: targetPageIndex + 1,
        limit: targetPageSize,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (response) => {
          const { pagination, metrics, data } = response;

          if (
            !force &&
            pagination.totalPages > 0 &&
            pagination.page > pagination.totalPages
          ) {
            this.isLoading = false;
            this.loadCategories(
              {
                pageIndex: pagination.totalPages - 1,
                pageSize: pagination.limit,
              },
              true
            );
            return;
          }

          const derivedPageIndex =
            pagination.totalPages === 0 ? 0 : Math.max(0, pagination.page - 1);

          this.categories = data;
          this.categoryMetrics = metrics;
          this.totalCategories = metrics.total;
          this.pagination = pagination;
          this.pageIndex = derivedPageIndex;
          this.pageSize = pagination.limit;
          this.lastUpdated = new Date();
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
    if (this.categoryForm.invalid || this.isSaving) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
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
        this.isSaving = false;
        this.resetForm();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.showSnackBar(
          `Failed to ${this.isEditing ? 'update' : 'create'} category`,
          'error'
        );
        this.isSaving = false;
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

  onStatusToggle(
    category: ProductCategory,
    change: MatSlideToggleChange
  ): void {
    const nextState = change.checked;
    const previousState = category.isActive;

    if (
      this.statusUpdatingIds.has(category.id) ||
      nextState === previousState
    ) {
      return;
    }

    this.setStatusUpdating(category.id, true);

    this.categoryService
      .updateCategory(category.id, { isActive: nextState })
      .pipe(finalize(() => this.setStatusUpdating(category.id, false)))
      .subscribe({
        next: () => {
          category.isActive = nextState;
          this.adjustMetricsAfterStatusChange(previousState, nextState);
          this.lastUpdated = new Date();
          this.showSnackBar(
            `Category ${nextState ? 'activated' : 'deactivated'}`,
            'success'
          );
        },
        error: (error) => {
          console.error('Error updating category status:', error);
          category.isActive = previousState;
          change.source.checked = previousState;
          this.showSnackBar('Failed to update category status', 'error');
        },
      });
  }

  isCategoryStatusUpdating(categoryId: string): boolean {
    return this.statusUpdatingIds.has(categoryId);
  }

  private setStatusUpdating(categoryId: string, isUpdating: boolean): void {
    const next = new Set(this.statusUpdatingIds);

    if (isUpdating) {
      next.add(categoryId);
    } else {
      next.delete(categoryId);
    }

    this.statusUpdatingIds = next;
  }

  private adjustMetricsAfterStatusChange(
    previousState: boolean,
    nextState: boolean
  ): void {
    if (previousState === nextState) {
      return;
    }

    const updatedMetrics: CategoryMetrics = {
      ...this.categoryMetrics,
    };

    if (nextState) {
      updatedMetrics.active += 1;
      updatedMetrics.inactive = Math.max(0, updatedMetrics.inactive - 1);
    } else {
      updatedMetrics.active = Math.max(0, updatedMetrics.active - 1);
      updatedMetrics.inactive += 1;
    }

    this.categoryMetrics = updatedMetrics;
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingCategory = null;
    this.isSaving = false;
    this.categoryForm.reset({
      name: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
  }

  refreshCategories(): void {
    if (!this.isLoading) {
      this.loadCategories();
    }
  }

  onPageChange(event: PageEvent): void {
    if (this.isLoading) {
      return;
    }

    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCategories({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    });
  }

  trackByCategory(_index: number, category: ProductCategory): string {
    return category.id;
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
