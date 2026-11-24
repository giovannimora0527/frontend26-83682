import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Auth guard. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const login = router.createUrlTree(['/login']);

  if (!auth.tieneToken()) {
    return login;
  }

  return auth.validarSesion().pipe(
    map(() => true),
    catchError(() => of(login))
  );
};
