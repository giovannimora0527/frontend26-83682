import { Component } from '@angular/core';
import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from './service/cliente.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-cliente',
  imports: [TablaListadoComponent],
  templateUrl: './cliente.component.html'
})
export class ClienteComponent {
  titulo = 'Clientes';
  items: Cliente[] = [];
  columnas: Columna[] = [
    { titulo: 'Documento', valor: (c: Cliente) => `${c.tipoDocumento ?? ''} ${c.numeroDocumento ?? ''}` },
    { titulo: 'Nombres', valor: (c: Cliente) => c.nombres },
    { titulo: 'Apellidos', valor: (c: Cliente) => c.apellidos },
    { titulo: 'Nacimiento', valor: (c: Cliente) => soloFecha(c.fechaNacimiento) },
    { titulo: 'Género', valor: (c: Cliente) => c.genero },
    { titulo: 'Teléfono', valor: (c: Cliente) => c.telefono },
    { titulo: 'Dirección', valor: (c: Cliente) => c.direccion },
    { titulo: 'Activo', valor: (c: Cliente) => c.activo ? 'Sí' : 'No' }
  ];

  constructor(private readonly servicio: ClienteService) {
    this.listar();
  }

  listar() {
    this.servicio.listarClientes().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener clientes:', error)
    });
  }
}
