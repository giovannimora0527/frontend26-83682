import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Medico } from 'src/app/models/medico';
import { MedicoService } from './service/medico.service';

@Component({
  selector: 'app-medico',
  imports: [CommonModule],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.scss'
})
export class MedicoComponent {
  medicos: Medico[] = [];
  cargando = true;
  error = '';

  constructor(private readonly medicoService: MedicoService) {
    this.cargarMedicos();
  }

  cargarMedicos(): void {
    this.cargando = true;
    this.error = '';
    this.medicoService.listarMedicos().subscribe({
      next: (medicos) => {
        this.medicos = medicos;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener los médicos:', error);
        this.error = 'No fue posible cargar los médicos.';
        this.cargando = false;
      }
    });
  }
}
