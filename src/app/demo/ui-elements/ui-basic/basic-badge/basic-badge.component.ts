import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';

/** Componente visual «basic badge» de la plantilla de la aplicación. */
@Component({
  selector: 'app-basic-badge',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './basic-badge.component.html',
  styleUrls: ['./basic-badge.component.scss']
})
export default class BasicBadgeComponent {}
