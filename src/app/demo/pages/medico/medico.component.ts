import { Component } from '@angular/core';
import { Medico } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { MedicoService } from './service/medico.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-medico',
  imports: [TablaListadoComponent],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.scss'
})
export class MedicoComponent {
  titulo = 'Médicos';
  items: Medico[] = [];
  especializaciones: Especializacion[] = [];
  columnas: Columna[] = [
    { titulo: 'Documento', valor: (m: Medico) => `${m.tipoDocumento ?? ''} ${m.numeroDocumento ?? ''}` },
    { titulo: 'Nombres', valor: (m: Medico) => m.nombres },
    { titulo: 'Apellidos', valor: (m: Medico) => m.apellidos },
    { titulo: 'Teléfono', valor: (m: Medico) => m.telefono },
    { titulo: 'Registro profesional', valor: (m: Medico) => m.registroProfesional },
    { titulo: 'Especialización', valor: (m: Medico) => this.nombreEspecializacion(m.especializacionId) }
  ];

  constructor(private readonly medicoService: MedicoService,
    private readonly especializacionService: EspecializacionService) {
    this.medicoService.listarMedicos().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener los médicos:', error)
    });
    this.especializacionService.listarEspecializaciones().subscribe({
      next: (data) => this.especializaciones = data,
      error: (error) => console.error('Error al obtener las especializaciones:', error)
    });
  }

  // Busca el nombre de la especializacion a partir de su id (el back solo envia el id).
  private nombreEspecializacion(id?: number): string {
    return this.especializaciones.find((e) => e.id === id)?.nombre ?? '';
  }
}
