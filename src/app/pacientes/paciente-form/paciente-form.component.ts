import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Paciente } from '../paciente.model';
import { PacienteService } from '../paciente.service';
import { Cliente } from '../../clientes/cliente.model';
import { ClienteService } from '../../clientes/cliente.service';
import { OnInit } from '@angular/core';

/**
 * Componente con el formulario para crear un nuevo paciente.
 */
@Component({
  selector: 'app-paciente-form',
  templateUrl: './paciente-form.component.html',
  styleUrls: ['./paciente-form.component.css']
})
export class PacienteFormComponent implements OnInit {

  /** Objeto que se va llenando con lo que el usuario escribe en el formulario. */
  paciente: Paciente = {
    nombre: '',
    especie: '',
    raza: '',
    propietario: '',
    clienteId: undefined
  };
  clientes: Cliente[] = [];
  ngOnInit(): void { this.clienteService.listar().subscribe({ next: datos => this.clientes = datos, error: () => this.mensajeError = 'No se pudieron cargar los clientes.' }); }

  /** Copia el nombre del cliente al campo legado propietario por compatibilidad. */
  seleccionarCliente(): void { const cliente = this.clientes.find(c => c.id === this.paciente.clienteId); this.paciente.propietario = cliente?.nombre || ''; }

  /** Mensaje de error a mostrar si la creacion falla. */
  mensajeError = '';

  /** Indica si se esta guardando (para deshabilitar el boton y evitar doble click). */
  guardando = false;

  /**
   * @param pacienteService servicio para crear el paciente en el backend
   * @param router           usado para volver a la lista despues de guardar
   */
  constructor(private pacienteService: PacienteService, private router: Router, private clienteService: ClienteService) { }

  /**
   * Envia el formulario al backend para crear el paciente.
   * Se llama desde el evento (ngSubmit) del formulario en el HTML.
   */
  guardar(): void {
    this.guardando = true;
    this.mensajeError = '';
    if (!this.paciente.clienteId) { this.mensajeError = 'Seleccione un cliente registrado.'; this.guardando = false; return; }

    this.pacienteService.crear(this.paciente).subscribe({
      next: () => {
        // Si se creo correctamente, volvemos a la lista de pacientes.
        this.router.navigate(['/pacientes']);
      },
      error: (error) => {
        this.mensajeError = 'No se pudo crear el paciente. Revise los datos ingresados.';
        this.guardando = false;
        console.error(error);
      }
    });
  }
}
