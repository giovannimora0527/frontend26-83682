import { Component } from '@angular/core';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaService } from './service/formula-medica.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-formula-medica',
  imports: [TablaListadoComponent],
  templateUrl: './formula-medica.component.html'
})
export class FormulaMedicaComponent {
  titulo = 'Fórmulas médicas';
  items: FormulaMedica[] = [];
  columnas: Columna[] = [
    { titulo: 'Cita', valor: (c: FormulaMedica) => c.cita?.id },
    { titulo: 'Mascota', valor: (c: FormulaMedica) => c.cita?.mascota?.nombreMascota },
    { titulo: 'Medicamento', valor: (c: FormulaMedica) => c.medicamento?.nombre },
    { titulo: 'Dosis', valor: (c: FormulaMedica) => c.dosis },
    { titulo: 'Indicaciones', valor: (c: FormulaMedica) => c.indicaciones },
    { titulo: 'Fecha de creación', valor: (c: FormulaMedica) => fechaHora(c.fechaCreacionRegistro) }
  ];

  constructor(private readonly servicio: FormulaMedicaService) {
    this.listar();
  }

  listar() {
    this.servicio.listarFormulas().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener fórmulas médicas:', error)
    });
  }
}
