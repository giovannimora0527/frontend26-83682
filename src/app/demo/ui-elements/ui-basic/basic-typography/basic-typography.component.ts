import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';

/** Componente visual «basic typography» de la plantilla de la aplicación. */
@Component({
  selector: 'app-basic-typography',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './basic-typography.component.html',
  styleUrls: ['./basic-typography.component.scss']
})
export default class BasicTypographyComponent {}
