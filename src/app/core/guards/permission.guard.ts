import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const permissionsAll =
      (route.data['permissionsAll'] as string[] | undefined) ||
      (route.data['permissions'] as string[] | undefined);
    const permissionsAny = route.data['permissionsAny'] as string[] | undefined;

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          return this.router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url },
          });
        }

        if (
          permissionsAll?.length &&
          !this.authService.hasAllPermissions(permissionsAll)
        ) {
          return this.router.createUrlTree(['/dashboard']);
        }

        if (
          permissionsAny?.length &&
          !this.authService.hasAnyPermission(permissionsAny)
        ) {
          return this.router.createUrlTree(['/dashboard']);
        }

        return true;
      })
    );
  }
}
