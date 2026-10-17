import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from 'src/app/models/cliente';
import { getApiErrorMessage } from 'src/app/services/backend.service';
import { ClienteService } from './service/cliente.service';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent {
  clientes: Cliente[] = [];
  cargando = true;
  error = '';
  mensaje = '';
  desactivandoId: number | null = null;
  terminoBusqueda = '';

  constructor(private readonly clienteService: ClienteService) {
    this.cargarClientes();
  }

  get clientesFiltrados(): Cliente[] {
    const termino = this.terminoBusqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return this.clientes;
    }

    return this.clientes.filter((cliente) =>
      (
        `${cliente.clienteId ?? ''} ${cliente.usuarioId ?? ''} ${cliente.tipoDocumento ?? ''} ` +
        `${cliente.numeroDocumento ?? ''} ${cliente.nombres ?? ''} ${cliente.apellidos ?? ''} ` +
        `${cliente.telefono ?? ''} ${cliente.direccion ?? ''}`
      )
        .toLocaleLowerCase()
        .includes(termino)
    );
  }

  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
  }

  desactivarCliente(cliente: Cliente): void {
    if (cliente.clienteId === undefined || cliente.activo === false || this.desactivandoId !== null) {
      return;
    }
    if (!window.confirm(`¿Desactivar a ${cliente.nombres ?? 'este cliente'} ${cliente.apellidos ?? ''}?`)) {
      return;
    }

    this.desactivandoId = cliente.clienteId;
    this.error = '';
    this.mensaje = '';
    this.clienteService.desactivarCliente(cliente.clienteId).subscribe({
      next: () => {
        this.mensaje = 'El cliente se desactivó correctamente.';
        this.cargarClientes();
      },
      error: (error: unknown) => {
        console.error('Error al desactivar el cliente:', error);
        this.error = getApiErrorMessage(error, 'No fue posible desactivar el cliente.');
        this.desactivandoId = null;
      },
      complete: () => {
        this.desactivandoId = null;
      }
    });
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';
    this.clienteService.listarClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener los clientes:', error);
        this.error = 'No fue posible cargar los clientes.';
        this.cargando = false;
      }
    });
  }
}
