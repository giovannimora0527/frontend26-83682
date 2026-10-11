import { Component } from '@angular/core';
import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoService } from './service/medicamento.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-medicamento',
  imports: [TablaListadoComponent],
  templateUrl: './medicamento.component.html'
})
export class MedicamentoComponent {
  titulo = 'Medicamentos';
  items: Medicamento[] = [];
  columnas: Columna[] = [
    { titulo: 'Nombre', valor: (c: Medicamento) => c.nombre },
    { titulo: 'Presentación', valor: (c: Medicamento) => c.presentacion },
    { titulo: 'Descripción', valor: (c: Medicamento) => c.descripcion },
    { titulo: 'Fecha de compra', valor: (c: Medicamento) => soloFecha(c.fechaCompra) },
    { titulo: 'Fecha de vencimiento', valor: (c: Medicamento) => soloFecha(c.fechaVence) }
  ];

  constructor(private readonly servicio: MedicamentoService) {
    this.listar();
  }

  listar() {
    this.servicio.listarMedicamentos().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener medicamentos:', error)
    });
  }
}
