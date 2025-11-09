import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  Product,
  ProductCategory,
  ProductSearchFilters,
} from '../../../core/models';
import {
  ProductManagementService,
  ProductStatistics,
} from '../services/product-management.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'image',
    'sku',
    'name',
    'category',
    'price',
    'stock',
    'status',
    'actions',
  ];

  products: Product[] = [];
  categories: ProductCategory[] = [];
  brands: string[] = [];

  totalProducts = 0;
  pageSize = 20;
  currentPage = 1;
  isLoading = false;

  filterForm: FormGroup;
  selectedProducts: Set<string> = new Set();
  statistics: ProductStatistics | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductManagementService,
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      brand: [''],
      minPrice: [null],
      maxPrice: [null],
      isActive: [''],
      inStock: [''],
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadBrands();
    this.loadStatistics();
    this.setupFilterListener();
  }

  setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadProducts();
      });
  }

  loadProducts(): void {
    this.isLoading = true;
    const filters = this.buildFilters();

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.data;
        this.totalProducts = response.pagination.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.showSnackBar('Failed to load products', 'error');
        this.isLoading = false;
      },
    });
  }

  loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  loadBrands(): void {
    this.productService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      },
    });
  }

  loadStatistics(): void {
    this.productService.getProductStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      },
    });
  }

  buildFilters(): ProductSearchFilters {
    const formValue = this.filterForm.value;
    const filters: ProductSearchFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sort?.active || 'name',
      sortOrder: this.sort?.direction || 'asc',
    };

    if (formValue.search) filters.search = formValue.search;
    if (formValue.categoryId) filters.categoryId = formValue.categoryId;
    if (formValue.brand) filters.brand = formValue.brand;
    if (formValue.minPrice) filters.minPrice = formValue.minPrice;
    if (formValue.maxPrice) filters.maxPrice = formValue.maxPrice;
    if (formValue.isActive !== '')
      filters.isActive = formValue.isActive === 'true';
    if (formValue.inStock !== '')
      filters.inStock = formValue.inStock === 'true';

    return filters;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(sort: Sort): void {
    this.loadProducts();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      categoryId: '',
      brand: '',
      minPrice: null,
      maxPrice: null,
      isActive: '',
      inStock: '',
    });
  }

  addProduct(): void {
    this.router.navigate(['/products/new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/products/edit', product.id]);
  }

  viewProduct(product: Product): void {
    // TODO: Implement product details dialog
    console.log('View product:', product);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.showSnackBar('Product deleted successfully', 'success');
          this.loadProducts();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.showSnackBar('Failed to delete product', 'error');
        },
      });
    }
  }

  toggleProductStatus(product: Product): void {
    this.productService
      .updateProduct(product.id, { isActive: !product.isActive })
      .subscribe({
        next: () => {
          this.showSnackBar(
            `Product ${
              product.isActive ? 'deactivated' : 'activated'
            } successfully`,
            'success'
          );
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error updating product status:', error);
          this.showSnackBar('Failed to update product status', 'error');
        },
      });
  }

  toggleSelection(productId: string): void {
    if (this.selectedProducts.has(productId)) {
      this.selectedProducts.delete(productId);
    } else {
      this.selectedProducts.add(productId);
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedProducts.clear();
    } else {
      this.products.forEach((product) => this.selectedProducts.add(product.id));
    }
  }

  isAllSelected(): boolean {
    return (
      this.products.length > 0 &&
      this.selectedProducts.size === this.products.length
    );
  }

  isSomeSelected(): boolean {
    return this.selectedProducts.size > 0 && !this.isAllSelected();
  }

  bulkDelete(): void {
    if (this.selectedProducts.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${this.selectedProducts.size} products?`
      )
    ) {
      const ids = Array.from(this.selectedProducts);
      this.productService.bulkDeleteProducts(ids).subscribe({
        next: () => {
          this.showSnackBar(
            `${ids.length} products deleted successfully`,
            'success'
          );
          this.selectedProducts.clear();
          this.loadProducts();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error deleting products:', error);
          this.showSnackBar('Failed to delete products', 'error');
        },
      });
    }
  }

  exportProducts(): void {
    const filters = this.buildFilters();
    this.productService.exportProducts(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `products_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSnackBar('Products exported successfully', 'success');
      },
      error: (error) => {
        console.error('Error exporting products:', error);
        this.showSnackBar('Failed to export products', 'error');
      },
    });
  }

  importProducts(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.productService.bulkImportProducts(file).subscribe({
          next: (result) => {
            this.showSnackBar(
              `Import complete: ${result.success} successful, ${result.failed} failed`,
              result.failed > 0 ? 'warning' : 'success'
            );
            this.loadProducts();
            this.loadStatistics();
          },
          error: (error) => {
            console.error('Error importing products:', error);
            this.showSnackBar('Failed to import products', 'error');
          },
        });
      }
    };
    input.click();
  }

  manageCategories(): void {
    this.router.navigate(['/products/categories']);
  }

  getStockStatusColor(product: Product): string {
    if (!product.trackInventory) return 'primary';
    if (product.stockQuantity === 0) return 'warn';
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel)
      return 'accent';
    return 'primary';
  }

  getStockStatusIcon(product: Product): string {
    if (!product.trackInventory) return 'inventory';
    if (product.stockQuantity === 0) return 'remove_circle';
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel)
      return 'warning';
    return 'check_circle';
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
