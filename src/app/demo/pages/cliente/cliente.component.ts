import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';

/**
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE CLIENTES
 *
 * Consulta los clientes registrados en MySQL
 * mediante el backend Spring Boot.
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicio que consulta los clientes.
import { ClienteService } from 'src/app/services/cliente.service';

// Modelo de datos del cliente.
import { Cliente } from 'src/app/models/cliente';

@Component({
  selector: 'app-cliente',
  standalone: true,

  // Permite utilizar *ngIf, *ngFor y ngModel.
  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {

  // Lista original recibida desde Spring Boot.
  clientes: Cliente[] = [];

  // Texto utilizado para buscar clientes.
  textoBusqueda: string = '';

  // Estado de carga de la información.
  cargando: boolean = false;

  // Mensaje cuando ocurre un error.
  errorCarga: string = '';

  constructor(
    private readonly clienteService: ClienteService, private readonly sesion: AuthService
  ) {}

  /**
   * Se ejecuta cuando Angular abre el componente.
   */
  ngOnInit(): void {
    this.cargarClientes();
  }

  /**
   * Consultar los clientes registrados.
   *
   * Utiliza:
   * GET /clinica/v1/cliente/listar-todos
   */
  cargarClientes(): void {

    this.cargando = true;
    this.errorCarga = '';

    this.clienteService.listarClientes().subscribe({

      next: (respuesta: Cliente[]) => {

        this.clientes = respuesta ?? [];

        this.cargando = false;


      },

      error: (error) => {

        console.error(
          'Error al cargar clientes:',
          error
        );

        this.errorCarga =
          'No fue posible consultar los clientes. ' +
          'Verifica que Spring Boot esté ejecutándose.';

        this.cargando = false;
      }

    });
  }

  /**
   * Filtrar clientes por:
   * - ID
   * - Nombres
   * - Apellidos
   * - Número de documento
   *
   * No modifica la lista original.
   */
  get clientesFiltrados(): Cliente[] {

    const buscar = this.textoBusqueda
      .trim()
      .toLowerCase();

    if (!buscar) {
      return this.clientes;
    }

    return this.clientes.filter(cliente => {

      const contenido = [
        cliente.clienteId,
        cliente.nombres,
        cliente.apellidos,
        cliente.numeroDocumento
      ]
        .map(valor => String(valor ?? ''))
        .join(' ')
        .toLowerCase();

      return contenido.includes(buscar);

    });
  }

  /**
   * Limpiar el campo de búsqueda.
   */
  limpiarBusqueda(): void {
    this.textoBusqueda = '';
  }
  formulario: ReturnType<ClienteComponent['datos']> | null = null;
  editando?: number;
  porArchivar?: Cliente;
  guardando = false;
  errorOperacion = '';

  get puedeArchivar() {
    return ['ADMIN','ADMINISTRADOR'].includes(this.sesion.obtenerPerfil()?.trim().toUpperCase() ?? '');
  }

  datos(c?: Cliente) {
    return {tipoDocumento:c?.tipoDocumento ?? '',numeroDocumento:c?.numeroDocumento ?? '',
      nombres:c?.nombres ?? '',apellidos:c?.apellidos ?? '',
      fechaNacimiento:String(c?.fechaNacimiento ?? '').slice(0,10),genero:c?.genero ?? '',
      telefono:c?.telefono ?? '',direccion:c?.direccion ?? ''};
  }

  abrir(cliente?: Cliente) {
    this.errorOperacion = '';
    this.editando = cliente?.clienteId;
    if (!this.editando) {
      this.formulario = this.datos();
      return;
    }
    this.guardando = true;
    this.clienteService.consultar(this.editando).pipe(finalize(() => this.guardando = false)).subscribe({
      next: detalle => this.formulario = this.datos(detalle),
      error: error => this.mostrarError(error)
    });
  }

  guardar() {
    if (!this.formulario || this.guardando) return;
    this.errorOperacion = '';
    this.guardando = true;
    this.clienteService.guardar(this.formulario,this.editando).pipe(finalize(() => this.guardando = false)).subscribe({
      next: () => { this.formulario = null; this.cargarClientes(); },
      error: error => this.mostrarError(error)
    });
  }

  archivar() {
    const id = this.porArchivar?.clienteId;
    if (!id || this.guardando) return;
    this.errorOperacion = '';
    this.guardando = true;
    this.clienteService.archivar(id).pipe(finalize(() => this.guardando = false)).subscribe({
      next: () => { this.porArchivar = undefined; this.cargarClientes(); },
      error: error => this.mostrarError(error)
    });
  }

  private mostrarError(error: {error?: {mensaje?: string}}) {
    this.errorOperacion = error.error?.mensaje ?? 'No fue posible completar la operación.';
  }
}
