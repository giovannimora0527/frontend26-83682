import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Cita } from '../cita.model';
import { CitaService } from '../cita.service';
import { ClienteService } from '../../clientes/cliente.service';
import { Cliente } from '../../clientes/cliente.model';
import { VeterinarioService } from '../../veterinarios/veterinario.service';
import { Veterinario } from '../../veterinarios/veterinario.model';
import { Paciente } from '../../pacientes/paciente.model';
import { PacienteService } from '../../pacientes/paciente.service';

/**
 * Componente con el formulario para crear o actualizar una cita.
 *
 * El mismo componente se usa para las dos rutas:
 *   /citas/nueva        -> crea una cita nueva
 *   /citas/editar/:id   -> actualiza una cita existente
 *
 * Se sabe en cual de los dos casos esta porque se revisa si la ruta trae
 * un parametro "id".
 */
@Component({
  selector: 'app-cita-form',
  templateUrl: './cita-form.component.html',
  styleUrls: ['./cita-form.component.css']
})
export class CitaFormComponent implements OnInit {

  /** Objeto que se va llenando con lo que el usuario escribe en el formulario. */
  cita: Cita = {
    fecha: '',
    motivo: '',
    estado: 'PENDIENTE',
    pacienteId: 0,
    veterinarioId: 0
  };
  clientes: Cliente[] = [];
  mascotas: Paciente[] = [];
  veterinarios: Veterinario[] = [];
  clienteIdSeleccionado = 0;

  /** Lista de estados permitidos, igual al enum EstadoCita del backend. */
  estados = ['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA', 'ATENDIDA', 'COMPLETADA', 'CANCELADA'];

  /** Id de la cita que se esta editando (null si se esta creando una nueva). */
  idEdicion: number | null = null;

  /** Mensaje de error a mostrar si la operacion falla. */
  mensajeError = '';

  /** Indica si se esta guardando (para deshabilitar el boton y evitar doble click). */
  guardando = false;

  constructor(
    private citaService: CitaService,
    private router: Router,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private pacienteService: PacienteService,
    private veterinarioService: VeterinarioService
  ) { }

  /**
   * Revisa si la ruta actual trae un id (modo edicion). Si lo trae, busca
   * la cita seleccionada previamente en la lista para precargar el
   * formulario con sus datos actuales.
   */
  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: datos => this.clientes = datos, error: () => this.mensajeError = 'No se pudieron cargar los clientes.' });
    this.veterinarioService.listar().subscribe({ next: datos => this.veterinarios = datos.filter(v => v.activo), error: () => this.mensajeError = 'No se pudieron cargar los veterinarios.' });
    const idParametro = this.route.snapshot.paramMap.get('id');

    if (idParametro) {
      this.idEdicion = Number(idParametro);

      this.citaService.obtenerPorId(this.idEdicion).subscribe({
        next: cita => {
          this.cita = { ...cita, fecha: cita.fecha ? cita.fecha.substring(0, 16) : '' };
          this.clienteIdSeleccionado = cita.clienteId || 0;
          if (this.clienteIdSeleccionado) this.cargarMascotasCliente(this.clienteIdSeleccionado);
        },
        error: error => this.mensajeError = this.mensajeBackend(error, 'No se pudo consultar la cita.')
      });
    }
  }

  /**
   * Envia el formulario al backend: crea una cita nueva si no hay id de
   * edicion, o actualiza la existente si si lo hay.
   */
  /** Convierte la respuesta REST en un mensaje legible para el usuario. */
  private mensajeBackend(error: any, alternativo: string): string { return error?.error?.mensaje || error?.error?.message || error?.message || alternativo; }

  /** Consulta las mascotas exclusivamente desde el endpoint del cliente. */
  private cargarMascotasCliente(clienteId: number): void {
    this.clienteService.mascotas(clienteId).subscribe({ next: datos => this.mascotas = datos, error: error => this.mensajeError = this.mensajeBackend(error, 'No se pudieron cargar las mascotas del cliente.') });
  }
  /** Mascotas devueltas por el endpoint del cliente seleccionado. */
  get mascotasDelCliente(): Paciente[] { return this.mascotas; }

  /** Cambia el propietario seleccionado y consulta sus mascotas en backend. */
  cambiarCliente(): void {
    this.cita.pacienteId = 0; this.cita.clienteId = this.clienteIdSeleccionado; this.mascotas = [];
    if (this.clienteIdSeleccionado) this.cargarMascotasCliente(this.clienteIdSeleccionado);
  }

  guardar(): void {
    this.guardando = true;
    this.mensajeError = '';
    this.cita.clienteId = this.clienteIdSeleccionado;
    if (!this.cita.clienteId || !this.cita.pacienteId || !this.cita.veterinarioId) { this.mensajeError = 'Seleccione una mascota y un veterinario.'; this.guardando = false; return; }

    const operacion = this.idEdicion
      ? this.citaService.actualizar(this.idEdicion, this.cita)
      : this.citaService.crear(this.cita);

    operacion.subscribe({
      next: () => {
        this.router.navigate(['/citas']);
      },
      error: (error) => {
        this.mensajeError = this.mensajeBackend(error, 'No se pudo guardar la cita. Verifique los datos e intente nuevamente.');
        this.guardando = false;
        console.error(error);
      }
    });
  }
}
