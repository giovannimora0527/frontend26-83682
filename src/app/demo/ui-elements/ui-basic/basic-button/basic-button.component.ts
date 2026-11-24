import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';

/** Componente visual «basic button» de la plantilla de la aplicación. */
@Component({
  selector: 'app-basic-button',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './basic-button.component.html',
  styleUrls: ['./basic-button.component.scss']
})
export default class BasicButtonComponent {}
