import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Medico } from 'src/app/models/medico';
import { getApiErrorMessage } from 'src/app/services/backend.service';
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
  mensaje = '';
  eliminandoId: number | null = null;
  terminoBusqueda = '';

  constructor(private readonly medicoService: MedicoService) {
    this.cargarMedicos();
  }

  get medicosFiltrados(): Medico[] {
    const termino = this.terminoBusqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return this.medicos;
    }

    return this.medicos.filter((medico) =>
      (
        `${medico.id ?? ''} ${medico.tipoDocumento ?? ''} ${medico.numeroDocumento ?? ''} ` +
        `${medico.nombres ?? ''} ${medico.apellidos ?? ''} ${medico.telefono ?? ''} ` +
        `${medico.registroProfesional ?? ''} ${medico.especializacionId ?? ''}`
      )
        .toLocaleLowerCase()
        .includes(termino)
    );
  }

  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
  }

  eliminarMedico(medico: Medico): void {
    if (medico.id === undefined || this.eliminandoId !== null) {
      return;
    }
    if (!window.confirm(`¿Eliminar al médico ${medico.nombres ?? ''} ${medico.apellidos ?? ''}?`)) {
      return;
    }

    this.eliminandoId = medico.id;
    this.error = '';
    this.mensaje = '';
    this.medicoService.eliminarMedico(medico.id).subscribe({
      next: () => {
        this.mensaje = 'El médico se eliminó correctamente.';
        this.cargarMedicos();
      },
      error: (error: unknown) => {
        console.error('Error al eliminar el médico:', error);
        this.error = getApiErrorMessage(error, 'No fue posible eliminar el médico.');
        this.eliminandoId = null;
      },
      complete: () => {
        this.eliminandoId = null;
      }
    });
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
