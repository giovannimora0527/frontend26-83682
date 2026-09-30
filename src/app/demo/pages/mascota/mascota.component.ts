import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MascotaService } from '../mascota/service/mascota.service';
import { Mascota } from 'src/app/models/mascota';

@Component({
  selector: 'app-mascota',
  imports: [CommonModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent { 
  
  mascotaList: Mascota[] = []; 

  constructor(private mascotaService: MascotaService) {
     this.listarMascotas();
  }

  listarMascotas() {
     this.mascotaService
     .listarMascotas()
     .subscribe(
      {
        next: (data) => {
          this.mascotaList = data;
          console.log(this.mascotaList);
        },
        error: (error) => {
          console.log(error);
        }
      }
     );
  }

  
  

}
