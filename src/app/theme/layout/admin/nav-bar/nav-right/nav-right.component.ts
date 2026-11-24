import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Rol } from 'src/app/models/estados';
import { ETIQUETAS_ROL } from 'src/app/shared/estados-ui';
import { AuthService } from 'src/app/demo/pages/login/service/auth.service';

@Component({
  selector: 'app-nav-right',
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.obtenerUsuario();
  readonly rol = ETIQUETAS_ROL[this.usuario?.rol as Rol] ?? this.usuario?.rol;
  cerrando = false;

  cerrarSesion(): void {
    if (this.cerrando) {
      return;
    }
    this.cerrando = true;
    this.authService.cerrarSesion().subscribe(() => void this.router.navigate(['/login']));
  }
}
