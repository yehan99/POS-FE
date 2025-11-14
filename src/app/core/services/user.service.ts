import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  UserListItem,
} from '../models/user-management.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly usersSubject = new BehaviorSubject<UserListItem[]>([]);

  readonly users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUsers(): Observable<UserListItem[]> {
    return this.http
      .get<UserListItem[]>(this.baseUrl)
      .pipe(tap((users) => this.usersSubject.next(users)));
  }

  createUser(payload: CreateUserRequest): Observable<UserListItem> {
    return this.http.post<UserListItem>(this.baseUrl, payload).pipe(
      tap((user) => {
        const current = this.usersSubject.value;
        this.usersSubject.next([...current, user]);
      })
    );
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${userId}/deactivate`, {})
      .pipe(tap(() => this.refreshUsersAfterMutation()));
  }

  reactivateUser(userId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${userId}/activate`, {})
      .pipe(tap(() => this.refreshUsersAfterMutation()));
  }

  private refreshUsersAfterMutation(): void {
    this.loadUsers().subscribe({
      error: (error) => {
        console.error('Failed to refresh users after mutation', error);
      },
    });
  }
}
