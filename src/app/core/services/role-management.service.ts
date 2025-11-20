import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PermissionMatrixModule,
  RolePermissionMatrixRow,
  RoleSummary,
  UpdateRolePermissionsRequest,
} from '../models/role-management.model';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<RoleSummary[]> {
    return this.http
      .get<{ data: RoleSummary[] }>(this.baseUrl)
      .pipe(map((response) => response.data));
  }

  getRole(id: string): Observable<RoleSummary> {
    return this.http
      .get<{ data: RoleSummary }>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getPermissionModules(): Observable<{ modules: PermissionMatrixModule[] }> {
    return this.http.get<{ modules: PermissionMatrixModule[] }>(
      `${this.baseUrl}/modules`
    );
  }

  updateRolePermissions(
    roleId: string,
    matrix: RolePermissionMatrixRow[]
  ): Observable<RoleSummary> {
    const payload: UpdateRolePermissionsRequest = { matrix };
    return this.http
      .put<{ data: RoleSummary }>(`${this.baseUrl}/${roleId}`, payload)
      .pipe(map((response) => response.data));
  }
}
