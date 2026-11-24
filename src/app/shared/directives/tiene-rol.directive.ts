import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from 'src/app/demo/pages/login/service/auth.service';
import { Rol } from 'src/app/models/estados';

/** Muestra el contenido solo a los roles indicados: *appTieneRol="['ADMINISTRADOR']". */
@Directive({
  selector: '[appTieneRol]'
})
export class TieneRolDirective {
  readonly appTieneRol = input.required<Rol[]>();

  constructor() {
    const authService = inject(AuthService);
    const contenedor = inject(ViewContainerRef);
    const plantilla = inject<TemplateRef<unknown>>(TemplateRef);
    effect(() => {
      contenedor.clear();
      if (authService.tieneRol(...this.appTieneRol())) {
        contenedor.createEmbeddedView(plantilla);
      }
    });
  }
}
