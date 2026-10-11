import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Cita } from 'src/app/models/cita';
import { CitaService } from './service/cita.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-cita',
  imports: [FormsModule, TablaListadoComponent],
  templateUrl: './cita.component.html'
})
export class CitaComponent {
  titulo = 'Citas';
  items: Cita[] = [];
  // Rango amplio por defecto para ver todas las citas; el back exige ambas fechas.
  fechaInicial = '2000-01-01';
  fechaFinal = '2100-12-31';
  columnas: Columna[] = [
    { titulo: 'Fecha y hora', valor: (c: Cita) => fechaHora(c.fechaHora) },
    { titulo: 'Cliente', valor: (c: Cita) => `${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}` },
    { titulo: 'Mascota', valor: (c: Cita) => c.mascota?.nombreMascota },
    { titulo: 'Médico', valor: (c: Cita) => `${c.medico?.nombres ?? ''} ${c.medico?.apellidos ?? ''}` },
    { titulo: 'Estado', valor: (c: Cita) => c.estado },
    { titulo: 'Motivo', valor: (c: Cita) => c.motivo }
  ];

  constructor(private readonly citaService: CitaService) {
    this.listar();
  }

  listar() {
    if (!this.fechaInicial || !this.fechaFinal) {
      Swal.fire('Atención', 'Seleccione ambas fechas', 'warning');
      return;
    }
    this.citaService.listarPorFecha(`${this.fechaInicial}T00:00:00`, `${this.fechaFinal}T23:59:59`).subscribe({
      next: (data) => this.items = data,
      error: (error) => Swal.fire('Error', error?.error?.message ?? 'No fue posible obtener las citas', 'error')
    });
  }
}
