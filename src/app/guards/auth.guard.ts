import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../demo/pages/login/service/auth.service';

/** Exige un token presente, decodificable y vigente; si no, limpia la sesión y envía a login. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  authService.limpiarSesion();
  return router.createUrlTree(['/login']);
};
