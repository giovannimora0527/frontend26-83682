import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaService } from './service/historia-medica.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-historia-medica',
  imports: [FormsModule, TablaListadoComponent],
  templateUrl: './historia-medica.component.html'
})
export class HistoriaMedicaComponent {
  titulo = 'Historias médicas';
  items: HistoriaMedica[] = [];
  // Si ambas fechas estan vacias se listan todas las historias.
  fechaInicial = '';
  fechaFinal = '';
  columnas: Columna[] = [
    { titulo: 'Historia', valor: (h: HistoriaMedica) => h.id },
    { titulo: 'Mascota', valor: (h: HistoriaMedica) => h.mascota?.nombreMascota },
    { titulo: 'Cliente', valor: (h: HistoriaMedica) => `${h.mascota?.cliente?.nombres ?? ''} ${h.mascota?.cliente?.apellidos ?? ''}` },
    { titulo: 'Fecha de creación', valor: (h: HistoriaMedica) => fechaHora(h.fechaCreacion) }
  ];

  constructor(private readonly historiaService: HistoriaMedicaService) {
    this.listar();
  }

  listar() {
    if (!!this.fechaInicial !== !!this.fechaFinal) {
      Swal.fire('Atención', 'Seleccione ambas fechas o deje las dos vacías', 'warning');
      return;
    }
    const inicial = this.fechaInicial ? `${this.fechaInicial}T00:00:00` : undefined;
    const final = this.fechaFinal ? `${this.fechaFinal}T23:59:59` : undefined;
    this.historiaService.listarHistorias(inicial, final).subscribe({
      next: (data) => this.items = data,
      error: (error) => Swal.fire('Error', error?.error?.message ?? 'No fue posible obtener las historias', 'error')
    });
  }
}
