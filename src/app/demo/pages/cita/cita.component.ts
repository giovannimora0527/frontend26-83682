
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE CITAS
 * ==========================================================
 *
 * Funcionalidades:
 * 1. Consultar las citas.
 * 2. Cargar clientes desde MySQL.
 * 3. Cargar mascotas desde MySQL.
 * 4. Filtrar mascotas según su propietario.
 * 5. Buscar y filtrar citas.
 * 6. Paginar los registros.
 * 7. Crear nuevas citas.
 * 8. Actualizar citas existentes.
 * 9. Validar los datos.
 * 10. Mostrar mensajes con SweetAlert2.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import Swal from 'sweetalert2';

// Servicio HTTP general.
import { BackendService } from 'src/app/services/backend.service';

// Servicio y modelo de clientes.
import { ClienteService } from 'src/app/services/cliente.service';
import { Cliente } from 'src/app/models/cliente';

// Servicio y modelo de mascotas.
import { MascotaService } from '../mascota/service/mascota.service';
import { Mascota } from 'src/app/models/mascota';


 // ==========================================================
 // SERVICIO Y MODELO DE MÉDICOS VETERINARIOS
 // ==========================================================

 // Servicio encargado de consultar los médicos en Spring Boot.
 import { MedicoService } from 'src/app/services/medico.service';

 // Modelo que representa los médicos registrados en MySQL.
 import { Medico } from 'src/app/models/medico';


// Dirección del backend.
import { environment } from 'src/environments/environment';

// ==========================================================
// 2. MODELOS DE CITAS
// ==========================================================

/**
 * Representa una cita recibida desde Spring Boot.
 */
export interface Cita {
  id: number;
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  estado: string;
  motivo: string | null;
}

/**
 * Información enviada para crear o actualizar citas.
 */
export interface CrearCitaDTO {
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  estado: string;
  motivo: string | null;
}

// ==========================================================
// 3. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({
  selector: 'app-cita',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {

  // ========================================================
  // 4. CONFIGURACIÓN DE API
  // ========================================================

  private readonly api = 'cita';

  // ========================================================
  // 5. LISTADO DE CITAS
  // ========================================================

  citas: Cita[] = [];

  cargando = false;

  errorCarga = '';

  // ========================================================
  // 6. CLIENTES
  // ========================================================

  /**
   * Clientes recuperados de:
   * GET /clinica/v1/cliente/listar-todos
   */
  clientes: Cliente[] = [];

  cargandoClientes = false;

  errorClientes = '';

  // ========================================================
  // 7. MASCOTAS - NUEVO
  // ========================================================

  /**
   * Mascotas recuperadas de:
   * GET /clinica/v1/mascota/listar-detalle
   *
   * Cada mascota incluye su propietario.
   */
  mascotas: Mascota[] = [];

  cargandoMascotas = false;

  errorMascotas = '';

  // ========================================================
  // 8. FILTROS
  // ========================================================

  busqueda = '';

  filtroEstado = '';

  readonly estados: string[] = [
    'pendiente',
    'programada',
    'confirmada',
    'atendida',
    'cancelada'
  ];

  // ========================================================
  // 9. PAGINACIÓN
  // ========================================================

  paginaActual = 1;

  readonly registrosPorPagina = 10;

  // ========================================================
  // 10. FORMULARIO
  // ========================================================

  formulario: FormGroup;

  mostrarFormulario = false;

  modoFormulario: 'crear' | 'editar' = 'crear';

  citaSeleccionadaId: number | null = null;

  guardando = false;


  // ======================================================
  // LISTADO DE MÉDICOS VETERINARIOS
  // ======================================================

  /**
   * Almacena los médicos consultados desde MySQL.
   *
   * Posteriormente se utilizará para mostrar
   * sus nombres y apellidos en el formulario
   * de registro de citas.
   */
  medicos: Medico[] = [];


  // ========================================================
  // 11. CONSTRUCTOR
  // ========================================================

  constructor(

  // Comunicación general con Spring Boot.
  private readonly backendService: BackendService,

  // Consulta de clientes registrados.
  private readonly clienteService: ClienteService,

  // Consulta de mascotas registradas.
  private readonly mascotaService: MascotaService,

  // Consulta de médicos veterinarios registrados.
  private readonly medicoService: MedicoService,

  // Construcción del formulario reactivo.
  private readonly formBuilder: FormBuilder
) {

    this.formulario = this.formBuilder.group({

      clienteId: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      mascotaId: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      medicoId: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      fechaHora: [
        '',
        Validators.required
      ],

      estado: [
        'programada',
        Validators.required
      ],

      motivo: ['']

    });

  }

  // ========================================================
  // 12. INICIALIZACIÓN
  // ========================================================

  ngOnInit(): void {





    // Consultar citas existentes.
    this.cargarCitas();

    // Consultar clientes registrados.
    this.cargarClientes();

    // Consultar mascotas registradas.
    this.cargarMascotas();
    this.cargarMedicos();
  }

  // ========================================================
  // 13. CARGAR CITAS
  // ========================================================

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
          'Citas cargadas:',
          this.citas
        );

      },

      error: (error) => {

        this.cargando = false;

        this.errorCarga =
          'No fue posible consultar las citas.';

        console.error(
          'Error al cargar citas:',
          error
        );

        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: this.errorCarga
        });

      }

    });

  }

  // ========================================================
  // 14. CARGAR CLIENTES
  // ========================================================

  cargarClientes(): void {

    this.cargandoClientes = true;
    this.errorClientes = '';

    this.clienteService.listarClientes().subscribe({

      next: (respuesta) => {

        this.clientes = respuesta ?? [];

        this.cargandoClientes = false;

        console.log(
          'Clientes cargados:',
          this.clientes
        );

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

  // ========================================================
  // 15. CARGAR MASCOTAS - NUEVO
  // ========================================================

  /**
   * Reutiliza MascotaService para consultar
   * todas las mascotas con sus propietarios.
   */
  cargarMascotas(): void {

    this.cargandoMascotas = true;

    this.errorMascotas = '';

    this.mascotaService.listarMascotas().subscribe({

      next: (respuesta) => {

        this.mascotas = respuesta ?? [];

        this.cargandoMascotas = false;

        console.log(
          'Mascotas cargadas para citas:',
          this.mascotas
        );

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

  // ========================================================
  // 16. OBTENER NOMBRE DE CLIENTE
  // ========================================================

  obtenerNombreCliente(cliente: Cliente): string {

    const nombres = cliente.nombres ?? '';

    const apellidos = cliente.apellidos ?? '';

    const documento = cliente.numeroDocumento ?? '';

    const nombreCompleto =
      `${nombres} ${apellidos}`.trim();

    if (documento) {
      return `${nombreCompleto} - ${documento}`;
    }

    return nombreCompleto ||
      `Cliente ${cliente.clienteId}`;

  }

  // ========================================================
  // 17. BUSCAR CLIENTE POR ID
  // ========================================================

  obtenerClientePorId(
    clienteId: number
  ): Cliente | undefined {

    return this.clientes.find(
      cliente =>
        Number(cliente.clienteId) === Number(clienteId)
    );

  }

  // ========================================================
  // 18. FILTRAR MASCOTAS POR CLIENTE - NUEVO
  // ========================================================

  /**
   * Devuelve únicamente las mascotas
   * cuyo propietario coincide con
   * el cliente elegido en el formulario.
   *
   * Ejemplo:
   *
   * Cliente seleccionado: 2
   *
   * Se mostrarán solo las mascotas cuyo
   * cliente.clienteId sea igual a 2.
   */
  get mascotasDelCliente(): Mascota[] {

    const clienteSeleccionado =
      this.formulario.get('clienteId')?.value;

    // Si no se seleccionó cliente,
    // no se muestran mascotas.
    if (
      clienteSeleccionado === null ||
      clienteSeleccionado === undefined ||
      clienteSeleccionado === ''
    ) {
      return [];
    }

    const clienteId = Number(clienteSeleccionado);

    return this.mascotas.filter((mascota: Mascota) => {

      const propietarioId =
        mascota.cliente?.clienteId;

      return Number(propietarioId) === clienteId;

    });

  }

  // ========================================================
  // 19. OBTENER NOMBRE DE MASCOTA - NUEVO
  // ========================================================

  /**
   * Texto utilizado para mostrar la mascota
   * dentro de la lista desplegable.
   */
  obtenerNombreMascota(mascota: Mascota): string {

    const nombre =
      mascota.nombreMascota ?? 'Sin nombre';

    const raza =
      mascota.raza?.nombre ?? 'Sin raza';

    return `${nombre} - ${raza}`;

  }

  // ========================================================
  // 20. CAMBIO DE CLIENTE - NUEVO
  // ========================================================

  /**
   * Cuando el usuario cambia de cliente,
   * se limpia la mascota anteriormente elegida.
   *
   * Evita asociar una mascota con
   * un propietario incorrecto.
   *
   * En el siguiente paso conectaremos
   * este método con el HTML.
   */
  alCambiarCliente(): void {

    this.formulario.get('mascotaId')?.reset(null);

  }

  // ========================================================
  // 21. FILTRAR CITAS
  // ========================================================

  get citasFiltradas(): Cita[] {

    const texto =
      this.busqueda.trim().toLowerCase();

    return this.citas.filter((cita: Cita) => {

      const coincideEstado =
        !this.filtroEstado ||
        cita.estado.toLowerCase() ===
        this.filtroEstado.toLowerCase();

      const cliente =
        this.obtenerClientePorId(cita.clienteId);

      const nombreCliente = cliente
        ? this.obtenerNombreCliente(cliente)
        : '';

      const datosBusqueda = [
        cita.id,
        cita.clienteId,
        nombreCliente,
        cita.mascotaId,
        cita.medicoId,
        cita.estado,
        cita.motivo ?? '',
        cita.fechaHora
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto =
        !texto || datosBusqueda.includes(texto);

      return coincideEstado && coincideTexto;

    });

  }

  // ========================================================
  // 22. PAGINACIÓN
  // ========================================================

  get totalPaginas(): number {

    return Math.ceil(
      this.citasFiltradas.length /
      this.registrosPorPagina
    );

  }

  get citasPaginadas(): Cita[] {

    const inicio =
      (this.paginaActual - 1) *
      this.registrosPorPagina;

    return this.citasFiltradas.slice(
      inicio,
      inicio + this.registrosPorPagina
    );

  }

  get paginas(): number[] {

    return Array.from(
      { length: this.totalPaginas },
      (_, indice) => indice + 1
    );

  }

  cambiarPagina(pagina: number): void {

    if (
      pagina >= 1 &&
      pagina <= this.totalPaginas
    ) {
      this.paginaActual = pagina;
    }

  }

  actualizarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {

    this.busqueda = '';

    this.filtroEstado = '';

    this.paginaActual = 1;

  }

  // ========================================================
  // 23. ABRIR FORMULARIO DE NUEVA CITA
  // ========================================================

  nuevaCita(): void {

    this.modoFormulario = 'crear';

    this.citaSeleccionadaId = null;

    this.formulario.reset({

      clienteId: null,
      mascotaId: null,
      medicoId: null,
      fechaHora: '',
      estado: 'programada',
      motivo: ''

    });

    this.mostrarFormulario = true;

  }

  // ========================================================
  // 24. EDITAR CITA
  // ========================================================

  editarCita(cita: Cita): void {

    this.modoFormulario = 'editar';

    this.citaSeleccionadaId = cita.id;

    this.formulario.patchValue({

      clienteId: cita.clienteId,

      mascotaId: cita.mascotaId,

      medicoId: cita.medicoId,

      fechaHora: cita.fechaHora.substring(0, 16),

      estado: cita.estado,

      motivo: cita.motivo ?? ''

    });

    this.mostrarFormulario = true;

  }

  // ========================================================
  // 25. CERRAR FORMULARIO
  // ========================================================

  cerrarFormulario(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;

    this.citaSeleccionadaId = null;

  }

  // ========================================================
  // 26. GUARDAR O ACTUALIZAR CITA
  // ========================================================

  guardarCita(): void {

    // Evitar peticiones duplicadas.
    if (this.guardando) {
      return;
    }

    // Verificar los campos del formulario.
    if (this.formulario.invalid) {

      this.formulario.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa los campos obligatorios.'
      });

      return;

    }

    const valores =
      this.formulario.getRawValue();

    const datos: CrearCitaDTO = {

      clienteId: Number(valores.clienteId),

      mascotaId: Number(valores.mascotaId),

      medicoId: Number(valores.medicoId),

      fechaHora: String(valores.fechaHora),

      estado: String(valores.estado),

      motivo:
        String(valores.motivo ?? '').trim() || null

    };

    // Comprobar que los IDs sean enteros positivos.
    const identificadoresValidos = [
      datos.clienteId,
      datos.mascotaId,
      datos.medicoId
    ].every(
      id => Number.isInteger(id) && id > 0
    );

    if (!identificadoresValidos) {

      Swal.fire({
        icon: 'warning',
        title: 'Identificadores incorrectos',
        text: 'Selecciona identificadores válidos.'
      });

      return;

    }

    // Verificar que la mascota corresponda
    // al cliente seleccionado.
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

        Swal.fire({
          icon: 'warning',
          title: 'Propietario incorrecto',
          text:
            'La mascota seleccionada no pertenece al cliente.'
        });

        return;

      }

    }

    // Validar fecha y hora.
    const fecha = new Date(datos.fechaHora);

    if (Number.isNaN(fecha.getTime())) {

      Swal.fire({
        icon: 'warning',
        title: 'Fecha inválida',
        text: 'Selecciona una fecha y hora válidas.'
      });

      return;

    }

    // Evitar nuevas citas en el pasado.
    if (
      this.modoFormulario === 'crear' &&
      fecha.getTime() < Date.now()
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Fecha incorrecta',
        text:
          'No puedes crear citas en fechas pasadas.'
      });

      return;

    }

    // Validar el ID cuando se está editando.
    if (
      this.modoFormulario === 'editar' &&
      this.citaSeleccionadaId === null
    ) {

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró la cita seleccionada.'
      });

      return;

    }

    this.guardando = true;

    // Elegir POST o PUT según la operación.
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

      next: (citaGuardada: Cita) => {

        this.guardando = false;

        this.cerrarFormulario();

        this.cargarCitas();

        Swal.fire({
          icon: 'success',
          title: 'Operación realizada',
          text:
            `La cita ${citaGuardada.id} se guardó correctamente.`
        });

      },

      error: (error) => {

        this.guardando = false;

        console.error(
          'Error al guardar cita:',
          error
        );

        const mensaje =
          error.error?.message ||
          error.error?.detail ||
          'No fue posible guardar la cita. Revisa los datos y el horario.';

        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: mensaje
        });

      }

    });

  }

  // ======================================================
  // CONSULTAR MÉDICOS VETERINARIOS DESDE MYSQL
  // ======================================================

  /**
   * Obtiene la lista de médicos registrados
   * desde el backend de Spring Boot.
   */
  cargarMedicos(): void {

    // Consultar los médicos.
    this.medicoService.listarMedicos().subscribe({

      // Cuando la consulta sea correcta.
      next: (respuesta: Medico[]) => {

        // Guardar los médicos recibidos.
        this.medicos = respuesta;

        console.log(
          'Médicos cargados correctamente:',
          this.medicos
        );
      },

      // Si ocurre un error.
      error: (error) => {

        console.error(
          'Error al cargar médicos:',
          error
        );

        this.medicos = [];
      }
    });
  }

  // ======================================================
  // OBTENER EL NOMBRE DEL MÉDICO VETERINARIO
  // ======================================================

  /**
   * Busca un médico en la lista cargada desde MySQL,
   * utilizando su identificador.
   *
   * @param id Identificador del médico.
   * @returns Nombre y apellido del veterinario.
   */
  obtenerNombreMedico(id: number): string {

    // Buscar el médico correspondiente.
    const medicoEncontrado = this.medicos.find(
      medico => Number(medico.id) === Number(id)
    );

    // Si existe, devolver su nombre completo.
    if (medicoEncontrado) {
      return `${medicoEncontrado.nombres} ${medicoEncontrado.apellidos}`;
    }

    // Si todavía no se cargaron los médicos,
    // mostrar temporalmente el identificador.
    return `Médico ID: ${id}`;
  }

}
