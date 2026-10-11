import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { HistoriaMedicaService } from '../historia-medica/service/historia-medica.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-anotacion-historia',
  imports: [CommonModule, FormsModule, TablaListadoComponent],
  templateUrl: './anotacion-historia.component.html'
})
export class AnotacionHistoriaComponent {
  titulo = 'Anotaciones de historia médica';
  items: AnotacionHistoria[] = [];
  historias: HistoriaMedica[] = [];
  historiaId: number | null = null;
  columnas: Columna[] = [
    { titulo: 'Fecha', valor: (a: AnotacionHistoria) => fechaHora(a.fecha) },
    { titulo: 'Médico', valor: (a: AnotacionHistoria) => `${a.medico?.nombres ?? ''} ${a.medico?.apellidos ?? ''}` },
    { titulo: 'Descripción', valor: (a: AnotacionHistoria) => a.descripcion }
  ];

  constructor(private readonly anotacionService: AnotacionHistoriaService,
    private readonly historiaService: HistoriaMedicaService) {
    // El back lista las anotaciones de una historia: se carga el catalogo y se elige la primera.
    this.historiaService.listarHistorias().subscribe({
      next: (data) => {
        this.historias = data;
        if (data.length > 0) {
          this.historiaId = data[0].id ?? null;
          this.listar();
        }
      },
      error: (error) => console.error('Error al obtener las historias:', error)
    });
  }

  listar() {
    if (this.historiaId === null) {
      this.items = [];
      return;
    }
    this.anotacionService.listarAnotaciones(this.historiaId).subscribe({
      next: (data) => this.items = data,
      error: (error) => Swal.fire('Error', error?.error?.message ?? 'No fue posible obtener las anotaciones', 'error')
    });
  }
}
