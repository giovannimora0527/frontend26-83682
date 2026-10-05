import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from 'src/app/models/cliente';
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

  constructor(private readonly clienteService: ClienteService) {
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
