import { Component } from '@angular/core';
import { Especializacion } from 'src/app/models/especializacion';
import { EspecializacionService } from './service/especializacion.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-especializacion',
  imports: [TablaListadoComponent],
  templateUrl: './especializacion.component.html'
})
export class EspecializacionComponent {
  titulo = 'Especializaciones';
  items: Especializacion[] = [];
  columnas: Columna[] = [
    { titulo: 'Código', valor: (c: Especializacion) => c.codigoEspecializacion },
    { titulo: 'Nombre', valor: (c: Especializacion) => c.nombre },
    { titulo: 'Descripción', valor: (c: Especializacion) => c.descripcion }
  ];

  constructor(private readonly servicio: EspecializacionService) {
    this.listar();
  }

  listar() {
    this.servicio.listarEspecializaciones().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener especializaciones:', error)
    });
  }
}
