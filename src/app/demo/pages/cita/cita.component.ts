import { HistorialMascotaComponent } from './historial-mascota.component';

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import Swal from 'sweetalert2';

import { BackendService } from 'src/app/services/backend.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { Cliente } from 'src/app/models/cliente';
import { MascotaService } from '../mascota/service/mascota.service';
import { Mascota } from 'src/app/models/mascota';
import { MedicoService } from 'src/app/services/medico.service';
import { Medico } from 'src/app/models/medico';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth.service';
import { AgendaService, DisponibilidadMedica, errorAgenda, Intervalo, RevisionCita } from '../../../services/agenda.service';
import { AgendaConfiguracionComponent } from './agenda-configuracion.component';
import { CitaService } from '../../../services/cita.service';
import { mensajeError } from '../../../utils/tabla-datos';

import { PaginadorComponent } from '../../../utils/paginador.component';
// ======================================================
// MODELOS DE CITAS MÉDICAS
// ======================================================

/** Modelo de datos «Cita» que se intercambia con el backend. */
export interface Cita {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de cliente. */
  clienteId: number;
  /** Identificador de mascota. */
  mascotaId: number;
  /** Identificador de médico. */
  medicoId: number;
  /** Fecha y hora (AAAA-MM-DDTHH:MM). */
  fechaHora: string;
  /** Fecha fin. */
  fechaFin: string;
  /** Estado actual del registro. */
  estado: string;
  /** Motivo registrado. */
  motivo: string | null;
  /** Nombres que envía el backend para el DataTable. */
  cliente?: string;
  /** Mascota (opcional). */
  mascota?: string;
  /** Veterinario (opcional). */
  veterinario?: string;
  /** Identificador de historia (opcional). */
  historiaId?: number | null;
}

/** Modelo de datos «CrearCitaDTO» que se intercambia con el backend. */
export interface CrearCitaDTO {
  /** Identificador de cliente. */
  clienteId: number;
  /** Identificador de mascota. */
  mascotaId: number;
  /** Identificador de médico. */
  medicoId: number;
  /** Fecha y hora (AAAA-MM-DDTHH:MM). */
  fechaHora: string;
  /** Fecha fin. */
  fechaFin: string;
  /** Estado actual del registro. */
  estado: string;
  /** Motivo registrado. */
  motivo: string | null;
}

// ======================================================
// COMPONENTE DE GESTIÓN DE CITAS
// ======================================================

/** Pantalla «cita» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-cita',
  standalone: true,
  imports: [PaginadorComponent, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AgendaConfiguracionComponent, HistorialMascotaComponent
  ],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {
  /** Mascota historial. */
  mascotaHistorial: number | null = null;

  // ====================================================
  // 1. CONFIGURACIÓN DEL BACKEND
  // ====================================================

  /** Ruta del recurso en la API del backend. */
  private readonly api = 'cita';

  // ====================================================
  // 2. LISTADOS
  // ====================================================

  /** Lista de citas. */
  citas: Cita[] = [];
  /** Lista de clientes. */
  clientes: Cliente[] = [];
  /** Lista de mascotas. */
  mascotas: Mascota[] = [];
  /** Lista de médicos. */
  medicos: Medico[] = [];

  // ====================================================
  // 3. ESTADOS DE CARGA
  // ====================================================

  /** Indica si se está cargando. */
  cargando = false;
  /** Indica si se está cargando clientes. */
  cargandoClientes = false;
  /** Indica si se está cargando mascotas. */
  cargandoMascotas = false;
  /** Indica si se está guardando. */
  guardando = false;

  /** Mensaje mostrado al usuario (error carga). */
  errorCarga = '';
  /** Mensaje mostrado al usuario (error clientes). */
  errorClientes = '';
  /** Mensaje mostrado al usuario (error mascotas). */
  errorMascotas = '';

  // NUEVO:
  // Mostrar los errores directamente dentro del modal.
  /** Mensaje mostrado al usuario (mensaje error guardar). */
  mensajeErrorGuardar = '';

  // ====================================================
  // 4. BÚSQUEDA Y FILTROS
  // ====================================================

  /** Criterio de filtrado: búsqueda. */
  busqueda = '';
  /** Criterio de filtrado: filtro estado. */
  filtroEstado = '';

  /** Dependencia inyectada (AgendaService). */
  private readonly agenda = inject(AgendaService);
  /** Dependencia inyectada (CitaService). */
  private readonly citasApi = inject(CitaService);
  /** Indica si es admin. */
  readonly esAdmin = inject(AuthService).tienePermiso('AGENDA_CONFIGURAR');
  /** Lista de estados. */
  readonly estados = ['pendiente', 'programada', 'confirmada', 'atendida', 'finalizada', 'cancelada'];

  // ---------------- Ordenamiento por columnas y filtro por rango de fechas ----------------
  /** Columna por la que se ordena el DataTable (inicialmente fecha y hora descendente). */
  ordenColumna: 'fechaHora' | 'cliente' | 'mascota' | 'veterinario' | 'estado' | 'id' = 'fechaHora';
  /** Orden dirección. */
  ordenDireccion: 'asc' | 'desc' = 'desc';
  /** Fecha desde. */
  fechaDesde = '';
  /** Fecha hasta. */
  fechaHasta = '';

  /** Cambia la columna de orden o invierte la dirección si es la misma. */
  ordenarPor(columna: 'fechaHora' | 'cliente' | 'mascota' | 'veterinario' | 'estado' | 'id'): void {
    this.ordenDireccion = this.ordenColumna === columna && this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    this.ordenColumna = columna;
    this.paginaActual = 1;
  }

  /**
   * Ícono que indica la dirección del ordenamiento de una columna.
   *
   * @param columna columna a ordenar.
   * @returns texto resultante.
   */
  iconoOrden(columna: string): string {
    return this.ordenColumna !== columna ? '↕' : this.ordenDireccion === 'asc' ? '▲' : '▼';
  }

  // ---------------- Combo dependiente: mascotas consultadas al backend por cliente ----------------
  /** Lista de mascotas cliente. */
  mascotasCliente: Mascota[] = [];

  /** Consulta al backend únicamente las mascotas del cliente seleccionado. */
  cargarMascotasDeCliente(clienteId: number | null): void {
    this.mascotasCliente = [];
    if (!clienteId) return;
    this.cargandoMascotas = true;
    this.citasApi.mascotasDeCliente(clienteId).subscribe({
      next: lista => {
        this.mascotasCliente = lista.map(m => ({ mascotaId: m.mascotaId, nombreMascota: m.nombreMascota, edad: m.edad,
          raza: { nombre: m.raza, especie: m.especie }, cliente: { clienteId: m.clienteId } }) as Mascota);
        this.cargandoMascotas = false;
      },
      error: e => {
        this.cargandoMascotas = false;
        this.mensajeErrorGuardar = mensajeError(e, 'No fue posible consultar las mascotas del cliente.');
      }
    });
  }

  // ---------------- Reactivación explícita de citas canceladas ----------------
  /** Cita reactivar. */
  citaReactivar: Cita | null = null;
  /** Reactivar inicio. */
  reactivarInicio = '';
  /** Reactivar fin. */
  reactivarFin = '';

  /**
   * Abre reactivar.
   *
   * @param cita cita seleccionada.
   */
  abrirReactivar(cita: Cita): void {
    this.citaReactivar = cita;
    this.errorAgenda = '';
    this.reactivarInicio = cita.fechaHora.slice(0, 16);
    this.reactivarFin = cita.fechaFin.slice(0, 16);
  }

  /** Reactiva la cita cancelada (vuelve a "pendiente"); el backend valida horario y superposiciones. */
  reactivar(): void {
    const cita = this.citaReactivar;
    if (!cita) return;
    this.citasApi.reactivar(cita.id, this.reactivarInicio, this.reactivarFin).subscribe({
      next: () => {
        this.citaReactivar = null;
        this.cargarCitas();
      },
      error: e => (this.errorAgenda = mensajeError(e, 'No fue posible reactivar la cita.'))
    });
  }
  /** Disponibilidad. */
  disponibilidad: DisponibilidadMedica | null = null;
  /** Médico configuración. */
  medicoConfiguracion: number | null = null;
  /** Cita historial. */
  citaHistorial: Cita | null = null;
  /** Lista de historial. */
  historial: RevisionCita[] = [];
  /** Mensaje mostrado al usuario (error agenda). */
  errorAgenda = '';

  /**
   * Estados formulario.
   *
   * @returns resultado de estados formulario.
   */
  get estadosFormulario(): string[] {
    if (this.modoFormulario === 'crear') return ['pendiente', 'programada', 'confirmada'];
    return this.esAdmin ? ['pendiente', 'programada', 'confirmada', 'cancelada', 'atendida'] : ['pendiente', 'programada', 'confirmada', 'cancelada'];
  }

  /** Consulta disponibilidad. */
  consultarDisponibilidad() {
    const medico = Number(this.formulario.get('medicoId')?.value);
    const fecha = String(this.formulario.get('fechaHora')?.value ?? '').slice(0, 10);
    this.disponibilidad = null;
    if (!medico || !fecha) {
      this.mensajeErrorGuardar = 'Selecciona un médico y la fecha de la cita.';
      return;
    }
    this.mensajeErrorGuardar = '';
    this.agenda.disponibilidad(medico, fecha).subscribe({
      next: franjas => {
        if (medico === Number(this.formulario.get('medicoId')?.value)
            && fecha === String(this.formulario.get('fechaHora')?.value ?? '').slice(0, 10)) this.disponibilidad = franjas;
      },
      error: err => { this.mensajeErrorGuardar = errorAgenda(err); }
    });
  }

  /**
   * Usa franja.
   *
   * @param franja franja.
   */
  usarFranja(franja: Intervalo) {
    // Si la franja de hoy ya empezó (la consulta se hizo hace unos minutos), se sugiere el siguiente cuarto
    // de hora con al menos 5 minutos de anticipación, para no enviar una hora que ya pasó.
    const minimo = new Date(Date.now() + 5 * 60_000);
    minimo.setUTCMinutes(Math.ceil(minimo.getUTCMinutes() / 15) * 15, 0, 0);
    const minimoBogota = new Date(minimo.getTime() - 5 * 3_600_000).toISOString().slice(0, 16);
    const inicio = franja.inicio.slice(0, 16) < minimoBogota ? minimoBogota : franja.inicio.slice(0, 16);
    const sugerido = new Date(new Date(inicio + 'Z').getTime() + 30 * 60_000).toISOString().slice(0, 16);
    const fin = franja.fin.slice(0, 16);
    this.formulario.patchValue({ fechaHora: inicio, fechaFin: sugerido < fin ? sugerido : fin });
    this.disponibilidad = null;
  }

  /**
   * Muestra historial.
   *
   * @param cita cita seleccionada.
   */
  verHistorial(cita: Cita) {
    this.citaHistorial = cita;
    this.historial = [];
    this.errorAgenda = '';
    this.agenda.historial(cita.id).subscribe({
      next: filas => { if (this.citaHistorial?.id === cita.id) this.historial = filas; },
      error: err => { this.errorAgenda = errorAgenda(err); }
    });
  }

  /**
   * Finaliza los datos de la pantalla.
   *
   * @param cita cita seleccionada.
   */
  finalizar(cita: Cita) {
    if (!confirm('¿Finalizar la cita atendida?')) return;
    this.errorAgenda = '';
    this.agenda.cambiar(cita.id, { estado: 'finalizada' }).subscribe({
      next: () => this.cargarCitas(),
      error: err => { this.errorAgenda = errorAgenda(err); }
    });
  }

  // ====================================================
  // 5. PAGINACIÓN
  // ====================================================

  /** Página actual. */
  paginaActual = 1;
  /** Registros por página. */
  readonly registrosPorPagina = 10;

  // ====================================================
  // 6. FORMULARIO
  // ====================================================

  /** Formulario reactivo: formulario. */
  formulario: FormGroup;

  /** Indica si se muestra formulario. */
  mostrarFormulario = false;

  /** Modo formulario. */
  modoFormulario: 'crear' | 'editar' = 'crear';

  /** Identificador de cita seleccionada. */
  citaSeleccionadaId: number | null = null;

  // ====================================================
  // 7. CONSTRUCTOR
  // ====================================================

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param backendService servicio backend.
   * @param clienteService servicio cliente.
   * @param mascotaService servicio mascota.
   * @param medicoService servicio médico.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    /** Dependencia inyectada (BackendService). */
    private readonly backendService: BackendService,
    /** Dependencia inyectada (ClienteService). */
    private readonly clienteService: ClienteService,
    /** Dependencia inyectada (MascotaService). */
    private readonly mascotaService: MascotaService,
    /** Dependencia inyectada (MedicoService). */
    private readonly medicoService: MedicoService,
    /** Formulario reactivo: form builder. */
    private readonly formBuilder: FormBuilder
  ) {

    this.formulario = this.formBuilder.group({

      clienteId: [
        null,
        [Validators.required, Validators.min(1)]
      ],

      mascotaId: [
        null,
        [Validators.required, Validators.min(1)]
      ],

      medicoId: [
        null,
        [Validators.required, Validators.min(1)]
      ],

      fechaHora: [
        '',
        Validators.required
      ],

      fechaFin: ['', Validators.required],

      estado: [
        'pendiente',
        Validators.required
      ],

      motivo: ['']

    });

  }

  // ====================================================
  // 8. INICIALIZACIÓN
  // ====================================================

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit(): void {
    this.cargarCitas();
    this.cargarClientes();
    this.cargarMascotas();
    this.cargarMedicos();
  }

  // ====================================================
  // 9. CARGAR CITAS MÉDICAS
  // ====================================================

  /** Carga citas desde el backend. */
  cargarCitas(): void {

    this.cargando = true;
    this.errorCarga = '';

    this.backendService.get<Cita[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    ).subscribe({

      next: (respuesta) => {

        this.citas = respuesta ?? [];
        this.cargando = false;
        this.paginaActual = 1;

        console.log(
          'Citas cargadas correctamente:',
          this.citas
        );

      },

      error: (error) => {

        this.cargando = false;
        this.errorCarga =
          'No fue posible consultar las citas médicas.';

        console.error(
          'Error al cargar citas:',
          error
        );

      }

    });

  }

  // ====================================================
  // 10. CARGAR CLIENTES
  // ====================================================

  /** Carga clientes desde el backend. */
  cargarClientes(): void {

    this.cargandoClientes = true;
    this.errorClientes = '';

    this.clienteService.listarClientes().subscribe({

      next: (respuesta) => {

        this.clientes = respuesta ?? [];
        this.cargandoClientes = false;

      },

      error: (error) => {

        this.cargandoClientes = false;

        this.errorClientes =
          'No fue posible cargar los clientes.';

        console.error(
          'Error al cargar clientes:',
          error
        );

      }

    });

  }

  // ====================================================
  // 11. CARGAR MASCOTAS
  // ====================================================

  /** Carga mascotas desde el backend. */
  cargarMascotas(): void {

    this.cargandoMascotas = true;
    this.errorMascotas = '';

    this.mascotaService.listarMascotas().subscribe({

      next: (respuesta) => {

        this.mascotas = respuesta ?? [];
        this.cargandoMascotas = false;

      },

      error: (error) => {

        this.cargandoMascotas = false;

        this.errorMascotas =
          'No fue posible cargar las mascotas.';

        console.error(
          'Error al cargar mascotas:',
          error
        );

      }

    });

  }

  // ====================================================
  // 12. CARGAR MÉDICOS
  // ====================================================

  /** Carga médicos desde el backend. */
  cargarMedicos(): void {

    this.medicoService.listarMedicos().subscribe({

      next: (respuesta: Medico[]) => {

        this.medicos = respuesta ?? [];

        console.log(
          'Médicos cargados:',
          this.medicos
        );

      },

      error: (error) => {

        this.medicos = [];

        console.error(
          'Error al cargar médicos:',
          error
        );

      }

    });

  }

  // ====================================================
  // 13. MOSTRAR NOMBRE DEL CLIENTE
  // ====================================================

  /**
   * Obtiene nombre cliente.
   *
   * @param cliente cliente.
   * @returns texto resultante.
   */
  obtenerNombreCliente(cliente: Cliente): string {

    const nombreCompleto =
      `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();

    const documento = cliente.numeroDocumento ?? '';

    return documento
      ? `${nombreCompleto} - ${documento}`
      : nombreCompleto || `Cliente ${cliente.clienteId}`;

  }

  // ====================================================
  // 14. OBTENER CLIENTE POR IDENTIFICADOR
  // ====================================================

  /**
   * Obtiene cliente por identificador.
   *
   * @param clienteId identificador de cliente.
   * @returns resultado de obtener cliente por identificador.
   */
  obtenerClientePorId(
    /** Identificador de cliente. */
    clienteId: number
  ): Cliente | undefined {

    return this.clientes.find(
      cliente =>
        Number(cliente.clienteId) === Number(clienteId)
    );

  }

  // ====================================================
  // 15. FILTRAR MASCOTAS DEL CLIENTE
  // ====================================================

  /**
   * Mascotas del cliente.
   *
   * @returns resultado de mascotas del cliente.
   */
  get mascotasDelCliente(): Mascota[] {

    const clienteSeleccionado =
      this.formulario.get('clienteId')?.value;

    if (
      clienteSeleccionado === null ||
      clienteSeleccionado === undefined ||
      clienteSeleccionado === ''
    ) {
      return [];
    }

    // Mascotas consultadas al backend para el cliente seleccionado (GET /cliente/{id}/mascotas).
    return this.mascotasCliente;

  }

  // ====================================================
  // 16. MOSTRAR NOMBRE DE LA MASCOTA
  // ====================================================

  /**
   * Obtiene nombre mascota.
   *
   * @param mascota mascota.
   * @returns texto resultante.
   */
  obtenerNombreMascota(mascota: Mascota): string {

    const nombre =
      mascota.nombreMascota ?? 'Sin nombre';

    const raza =
      mascota.raza?.nombre ?? 'Sin raza';

    return `${nombre} - ${raza}`;

  }

  // ====================================================
  // 17. MOSTRAR NOMBRE DEL MÉDICO
  // ====================================================

  /**
   * Obtiene nombre médico.
   *
   * @param id identificador del registro.
   * @returns texto resultante.
   */
  obtenerNombreMedico(id: number): string {

    const medico = this.medicos.find(
      item => Number(item.id) === Number(id)
    );

    if (medico) {
      return `${medico.nombres} ${medico.apellidos}`;
    }

    return `Médico ID: ${id}`;

  }

  // ====================================================
  // 18. CAMBIO DE CLIENTE
  // ====================================================

  /** Reacciona al evento cambiar cliente. */
  alCambiarCliente(): void {

    // Evita seleccionar una mascota de otro cliente y consulta solo las mascotas del cliente elegido.
    this.formulario.get('mascotaId')?.reset(null);
    this.cargarMascotasDeCliente(Number(this.formulario.get('clienteId')?.value) || null);

    // Limpiar errores anteriores.
    this.mensajeErrorGuardar = '';

  }

  // ====================================================
  // 19. FILTRAR CITAS
  // ====================================================

  /**
   * Citas filtradas.
   *
   * @returns resultado de citas filtradas.
   */
  get citasFiltradas(): Cita[] {

    const texto =
      this.busqueda.trim().toLowerCase();

    return this.citas.filter(cita => {

      const coincideEstado =
        !this.filtroEstado ||
        (cita.estado ?? '').toLowerCase() ===
        this.filtroEstado.toLowerCase();

      const cliente =
        this.obtenerClientePorId(cita.clienteId);

      const nombreCliente = cliente
        ? this.obtenerNombreCliente(cliente)
        : '';

      const nombreMedico =
        this.obtenerNombreMedico(cita.medicoId);

      const datosBusqueda = [
        cita.id,
        cita.clienteId,
        nombreCliente,
        cita.mascotaId,
        cita.mascota ?? '',
        cita.medicoId,
        nombreMedico,
        cita.estado,
        cita.motivo ?? '',
        cita.fechaHora
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto =
        !texto || datosBusqueda.includes(texto);

      const dia = (cita.fechaHora ?? '').slice(0, 10);
      const coincideFecha = (!this.fechaDesde || dia >= this.fechaDesde) && (!this.fechaHasta || dia <= this.fechaHasta);

      return coincideEstado && coincideTexto && coincideFecha;

    }).sort((a, b) => {
      const valor = (c: Cita): string | number => {
        switch (this.ordenColumna) {
          case 'id': return c.id;
          case 'cliente': return (c.cliente ?? '').toLowerCase();
          case 'mascota': return (c.mascota ?? '').toLowerCase();
          case 'veterinario': return (c.veterinario ?? this.obtenerNombreMedico(c.medicoId)).toLowerCase();
          case 'estado': return c.estado;
          default: return c.fechaHora;
        }
      };
      const x = valor(a), y = valor(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es');
      return this.ordenDireccion === 'asc' ? r : -r;
    });

  }

  // ====================================================
  // 20. PAGINACIÓN
  // ====================================================

  /**
   * Total páginas.
   *
   * @returns valor numérico calculado.
   */
  get totalPaginas(): number {

    return Math.max(1, Math.ceil(
      this.citasFiltradas.length /
      this.registrosPorPagina
    ));

  }

  /**
   * Citas paginadas.
   *
   * @returns resultado de citas paginadas.
   */
  get citasPaginadas(): Cita[] {

    const inicio =
      (this.paginaActual - 1) *
      this.registrosPorPagina;

    return this.citasFiltradas.slice(
      inicio,
      inicio + this.registrosPorPagina
    );

  }

  /**
   * Páginas.
   *
   * @returns resultado de páginas.
   */
  get paginas(): number[] {

    return Array.from(
      { length: this.totalPaginas },
      (_, indice) => indice + 1
    );

  }

  /**
   * Cambia página.
   *
   * @param pagina número de página.
   */
  cambiarPagina(pagina: number): void {

    if (
      pagina >= 1 &&
      pagina <= this.totalPaginas
    ) {
      this.paginaActual = pagina;
    }

  }

  /** Actualiza filtros. */
  actualizarFiltros(): void {
    this.paginaActual = 1;
  }

  /** Limpia filtros. */
  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroEstado = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.paginaActual = 1;

  }

  // ====================================================
  // 21. REGISTRAR NUEVA CITA
  // ====================================================

  /** Prepara el formulario para un nuevo registro de cita. */
  nuevaCita(): void {

    this.disponibilidad = null;
    this.modoFormulario = 'crear';
    this.citaSeleccionadaId = null;

    // NUEVO: evitar mostrar errores antiguos.
    this.mensajeErrorGuardar = '';

    this.formulario.reset({
      clienteId: null,
      mascotaId: null,
      medicoId: null,
      fechaHora: '',
      fechaFin: '',
      estado: 'pendiente',
      motivo: ''
    });

    this.mostrarFormulario = true;

  }

  // ====================================================
  // 22. EDITAR CITA
  // ====================================================

  /**
   * Prepara el formulario para editar cita.
   *
   * @param cita cita seleccionada.
   */
  editarCita(cita: Cita): void {

    this.disponibilidad = null;
    this.modoFormulario = 'editar';
    this.citaSeleccionadaId = cita.id;

    // NUEVO: limpiar mensajes al abrir otra cita.
    this.mensajeErrorGuardar = '';

    this.formulario.patchValue({
      clienteId: cita.clienteId,
      mascotaId: cita.mascotaId,
      medicoId: cita.medicoId,
      fechaHora: cita.fechaHora.substring(0, 16),
      fechaFin: cita.fechaFin.substring(0, 16),
      estado: cita.estado,
      motivo: cita.motivo ?? ''
    });
    this.cargarMascotasDeCliente(cita.clienteId);

    this.mostrarFormulario = true;

  }

  // ====================================================
  // 23. CERRAR EL FORMULARIO
  // ====================================================

  /** Cierra formulario. */
  cerrarFormulario(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.citaSeleccionadaId = null;
    this.mensajeErrorGuardar = '';

  }

  // ====================================================
  // 24. MOSTRAR ERRORES DENTRO DEL FORMULARIO
  // ====================================================

  /**
   * Muestra error formulario.
   *
   * @param mensaje mensaje.
   */
  private mostrarErrorFormulario(mensaje: string): void {

    this.mensajeErrorGuardar = mensaje;

    console.warn(
      'Validación del formulario:',
      mensaje
    );

  }

  // ====================================================
  // 25. GUARDAR O ACTUALIZAR CITA
  // ====================================================

  /** Guarda cita validando el formulario y enviándolo al backend. */
  guardarCita(): void {

    // Evitar enviar solicitudes duplicadas.
    if (this.guardando) {
      return;
    }

    // Limpiar el error anterior.
    this.mensajeErrorGuardar = '';

    // Verificar campos obligatorios.
    if (this.formulario.invalid) {

      this.formulario.markAllAsTouched();

      this.mostrarErrorFormulario(
        'Completa correctamente todos los campos obligatorios.'
      );

      return;
    }

    // Obtener información del formulario.
    const valores = this.formulario.getRawValue();

    const datos: CrearCitaDTO = {

      clienteId: Number(valores.clienteId),

      mascotaId: Number(valores.mascotaId),

      medicoId: Number(valores.medicoId),

      fechaHora: String(valores.fechaHora),
      fechaFin: String(valores.fechaFin),

      estado: String(valores.estado),

      motivo:
        String(valores.motivo ?? '').trim() || null

    };

    // ==================================================
    // VALIDACIÓN 1: IDENTIFICADORES
    // ==================================================

    const identificadoresValidos = [
      datos.clienteId,
      datos.mascotaId,
      datos.medicoId
    ].every(
      id => Number.isInteger(id) && id > 0
    );

    if (!identificadoresValidos) {

      this.mostrarErrorFormulario(
        'Selecciona un cliente, una mascota y un médico válidos.'
      );

      return;
    }

    // ==================================================
    // VALIDACIÓN 2: PROPIETARIO DE LA MASCOTA
    // ==================================================

    if (!this.cargandoMascotas && !this.errorMascotas) {

      const mascotaSeleccionada = this.mascotas.find(
        mascota =>
          Number(mascota.mascotaId) === datos.mascotaId
      );

      if (
        mascotaSeleccionada &&
        Number(mascotaSeleccionada.cliente?.clienteId) !==
        datos.clienteId
      ) {

        this.mostrarErrorFormulario(
          'La mascota seleccionada no pertenece al cliente.'
        );

        return;
      }

    }

    // ==================================================
    // VALIDACIÓN 3: FECHA Y HORA
    // ==================================================

    const fecha = new Date(datos.fechaHora + '-05:00');
    if (!datos.fechaFin || datos.fechaFin <= datos.fechaHora) {
      this.mostrarErrorFormulario('La hora final debe ser posterior a la inicial.');
      return;
    }

    if (Number.isNaN(fecha.getTime())) {

      this.mostrarErrorFormulario(
        'Selecciona una fecha y hora válidas.'
      );

      return;
    }

    // ==================================================
    // VALIDACIÓN 4: NO REGISTRAR CITAS EN EL PASADO
    // ==================================================

    if (
      this.modoFormulario === 'crear' &&
      fecha.getTime() < Date.now()
    ) {

      this.mostrarErrorFormulario(
        'No puedes registrar citas en fechas pasadas.'
      );

      return;
    }

    // ==================================================
    // VALIDACIÓN 5: EXISTENCIA DE CITA AL EDITAR
    // ==================================================

    if (
      this.modoFormulario === 'editar' &&
      this.citaSeleccionadaId === null
    ) {

      this.mostrarErrorFormulario(
        'No se encontró la cita que deseas actualizar.'
      );

      return;
    }

    // ==================================================
    // ENVIAR SOLICITUD AL BACKEND
    // ==================================================

    this.guardando = true;

    const peticion = this.modoFormulario === 'crear'

      ? this.backendService.post<Cita>(
          environment.apiUrlAuth,
          this.api,
          'crear',
          datos
        )

      : this.backendService.put<Cita>(
          environment.apiUrlAuth,
          this.api,
          `actualizar/${this.citaSeleccionadaId}`,
          datos
        );

    peticion.subscribe({

      // =================================================
      // RESPUESTA EXITOSA
      // =================================================

      next: (citaGuardada: Cita) => {

        this.guardando = false;

        this.mensajeErrorGuardar = '';

        this.cerrarFormulario();

        this.cargarCitas();

        Swal.fire({
          icon: 'success',
          title: 'Operación realizada',
          text:
            `La cita ${citaGuardada.id} se guardó correctamente.`
        });

      },

      // =================================================
      // NUEVO: MOSTRAR ERRORES SIN OCULTAR EL FORMULARIO
      // =================================================

      error: (error) => {

        this.guardando = false;

        console.error(
          'Error al guardar cita:',
          error
        );

        const mensajeBackend = error.error?.mensaje ?? error.error?.message ?? error.error?.detail ?? '';

        // Error HTTP 409: conflicto.
        if (error.status === 409) {

          this.mensajeErrorGuardar =
            mensajeBackend || 'El horario solicitado ya no está disponible.';

        }

        // Error HTTP 400: datos incorrectos.
        else if (error.status === 400) {

          this.mensajeErrorGuardar =
            mensajeBackend ||
            'La solicitud contiene datos incorrectos. ' +
            'Revisa el cliente, la mascota, el médico y la fecha.';

        }

        // Error HTTP 404: recurso no encontrado.
        else if (error.status === 404) {

          this.mensajeErrorGuardar =
            'No se encontró el recurso solicitado en el servidor.';

        }

        // Error de conexión.
        else if (error.status === 0) {

          this.mensajeErrorGuardar =
            'No se pudo conectar con Spring Boot. ' +
            'Comprueba que el backend esté encendido.';

        }

        // Otros errores.
        else {

          this.mensajeErrorGuardar =
            mensajeBackend ||
            'No fue posible guardar la cita. ' +
            'Revisa los datos e inténtalo nuevamente.';

        }

        // IMPORTANTE:
        // No cerrar el formulario cuando ocurra un error.
        // El usuario podrá corregir los datos y reintentar.

      }

    });

  }

}
