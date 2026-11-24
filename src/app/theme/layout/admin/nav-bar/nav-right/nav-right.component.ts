import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

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
  cerrando = false;

  cerrarSesion(): void {
    if (this.cerrando) {
      return;
    }
    this.cerrando = true;
    this.authService.cerrarSesion().subscribe(() => void this.router.navigate(['/login']));
  }
}
