import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../demo/pages/login/service/auth.service';

/** Solo permite la ruta si su data.menu está activo en el JWT. */
export const menuGuard: CanActivateFn = (route) => {
  const menu: unknown = route.data['menu'];
  if (typeof menu === 'string' && inject(AuthService).tieneMenu(menu)) {
    return true;
  }
  void Swal.fire('Acceso denegado', 'No tienes acceso a este módulo.', 'warning');
  return inject(Router).createUrlTree(['/inicio']);
};
