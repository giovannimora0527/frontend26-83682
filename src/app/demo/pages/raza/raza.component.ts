import { Component } from '@angular/core';
import { Raza } from 'src/app/models/raza';
import { RazaService } from './service/raza.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-raza',
  imports: [TablaListadoComponent],
  templateUrl: './raza.component.html'
})
export class RazaComponent {
  titulo = 'Razas';
  items: Raza[] = [];
  columnas: Columna[] = [
    { titulo: 'Nombre', valor: (c: Raza) => c.nombre },
    { titulo: 'Especie', valor: (c: Raza) => c.especie },
    { titulo: 'Fecha de creación', valor: (c: Raza) => fechaHora(c.fechaCreacion) }
  ];

  constructor(private readonly servicio: RazaService) {
    this.listar();
  }

  listar() {
    this.servicio.listarRazas().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener razas:', error)
    });
  }
}
