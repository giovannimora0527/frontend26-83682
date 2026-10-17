import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoriaMedica } from '../historia-medica.model';
import { HistoriaMedicaService } from '../historia-medica.service';
import { Cliente } from '../../clientes/cliente.model';
import { ClienteService } from '../../clientes/cliente.service';
import { Paciente } from '../../pacientes/paciente.model';
import { PacienteService } from '../../pacientes/paciente.service';
import { Veterinario } from '../../veterinarios/veterinario.model';
import { VeterinarioService } from '../../veterinarios/veterinario.service';
import { Cita } from '../../citas/cita.model';
import { CitaService } from '../../citas/cita.service';

/**
 * Componente con el formulario para crear o actualizar una historia
 * medica. Se usa para las dos rutas:
 *   /historias/nueva       -> crea una historia nueva
 *   /historias/editar/:id  -> actualiza una historia existente
 */
@Component({
  selector: 'app-historia-form',
  templateUrl: './historia-form.component.html',
  styleUrls: ['./historia-form.component.css']
})
export class HistoriaFormComponent implements OnInit {

  /** Objeto que se va llenando con lo que el usuario escribe en el formulario. */
  historia: HistoriaMedica = {
    diagnostico: '',
    observaciones: '',
    pacienteId: 0, fechaCreacion: this.fechaLocalActual()
  };
  clientes: Cliente[] = [];
  mascotas: Paciente[] = [];
  veterinarios: Veterinario[] = [];
  citas: Cita[] = [];
  clienteIdSeleccionado = 0;

  /** Id de la historia que se esta editando (null si se esta creando una nueva). */
  idEdicion: number | null = null;

  /** Mensaje de error a mostrar si la operacion falla. */
  mensajeError = '';

  /** Indica si el formulario esta cargando los datos de una historia existente. */
  cargando = false;

  /** Indica si se esta guardando (para deshabilitar el boton y evitar doble click). */
  guardando = false;

  constructor(
    private historiaMedicaService: HistoriaMedicaService,
    private router: Router,
    private route: ActivatedRoute, private clienteService: ClienteService, private pacienteService: PacienteService, private veterinarioService: VeterinarioService, private citaService: CitaService
  ) { }

  /**
   * Si la ruta trae un id, se consulta esa historia medica al backend
   * (GET /api/historias/{id}) para precargar el formulario.
   */
  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: d => this.clientes = d });
    this.veterinarioService.listar().subscribe({ next: d => this.veterinarios = d.filter(v => v.activo) });
    this.citaService.listarTodas().subscribe({ next: d => this.citas = d });
    const idParametro = this.route.snapshot.paramMap.get('id');

    if (idParametro) {
      this.idEdicion = Number(idParametro);
      this.cargando = true;

      this.historiaMedicaService.obtenerPorId(this.idEdicion).subscribe({
        next: (datos) => {
          this.historia = { ...datos, fechaCreacion: datos.fechaCreacion ? datos.fechaCreacion.substring(0, 16) : this.fechaLocalActual() };
          this.clienteIdSeleccionado = datos.clienteId || 0;
          if (this.clienteIdSeleccionado) this.cargarMascotasCliente(this.clienteIdSeleccionado);
          this.cargando = false;
        },
        error: (error) => {
          this.mensajeError = 'No se pudo cargar la historia médica solicitada.';
          this.cargando = false;
          console.error(error);
        }
      });
    }
  }

  /**
   * Envia el formulario al backend: crea una historia nueva si no hay id
   * de edicion, o actualiza la existente si si lo hay.
   */
  /** Fecha local para el control datetime-local. */
  private fechaLocalActual(): string { const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  /** Consulta las mascotas del propietario desde el backend. */
  private cargarMascotasCliente(clienteId: number): void {
    this.clienteService.mascotas(clienteId).subscribe({ next: datos => this.mascotas = datos, error: error => this.mensajeError = error?.error?.mensaje || 'No se pudieron cargar las mascotas del cliente.' });
  }
  /** Solo presenta las mascotas que devolvió el endpoint del cliente elegido. */
  get mascotasDelCliente(): Paciente[] { return this.mascotas; }
  get citasAtendidas(): Cita[] { return this.citas.filter(c => c.estado === 'ATENDIDA' || c.estado === 'COMPLETADA'); }
  get motivoConsultaSeleccionado(): string { return this.citasAtendidas.find(c => c.id === this.historia.citaId)?.motivo || ''; }
  cambiarCliente(): void { this.historia.pacienteId = 0; this.mascotas = []; if (this.clienteIdSeleccionado) this.cargarMascotasCliente(this.clienteIdSeleccionado); }

  guardar(): void {
    this.guardando = true;
    this.mensajeError = '';
    if (!this.historia.pacienteId || !this.historia.citaId || !this.historia.veterinarioId) { this.mensajeError = 'Seleccione una mascota, una cita y un veterinario.'; return; }

    const operacion = this.idEdicion
      ? this.historiaMedicaService.actualizar(this.idEdicion, this.historia)
      : this.historiaMedicaService.crear(this.historia);

    operacion.subscribe({
      next: () => {
        this.router.navigate(['/historias']);
      },
      error: (error) => {
        this.mensajeError = error?.error?.mensaje || error?.error?.message || 'No se pudo guardar la historia médica. Verifique las relaciones y los datos ingresados.';
        this.guardando = false;
        console.error(error);
      }
    });
  }
}
