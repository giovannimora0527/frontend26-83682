import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';

export const menuPermissionGuard: CanActivateChildFn = (_, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const menu = inject(MenuService);
  const inicio = router.createUrlTree(['/inicio']);
  const login = router.createUrlTree(['/login']);

  if (!auth.tieneToken()) {
    return login;
  }

  const ruta = state.url.split(/[?#]/)[0];
  return menu.obtenerMenusPropios().pipe(
    map(menus => {
      if (menus.some(opcion => opcion.url === ruta)) {
        return true;
      }
      auth.mostrarAccesoDenegado();
      return inicio;
    }),
    catchError(() => of(auth.tieneToken() ? inicio : login))
  );
};
