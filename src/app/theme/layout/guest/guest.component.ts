// angular import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Componente visual «guest» de la plantilla de la aplicación. */
@Component({
  selector: 'app-guest',
  imports: [RouterModule],
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.scss']
})
export class GuestComponent {}
