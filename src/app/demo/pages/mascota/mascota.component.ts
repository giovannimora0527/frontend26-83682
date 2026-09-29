import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MascotaService } from '../mascota/service/mascota.service'
import { Mascota } from 'src/app/models/mascota';

@Component({
  selector: 'app-mascota',
  imports: [CommonModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {  
  titleModule: string = "Componente administrativo para gestionar mascotas en el sistema";
  
 

  constructor() {
    
  }

  
  

}
