
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - GESTIÓN DE MASCOTAS
 * ==========================================================
 *
 * Funcionalidades:
 *
 * 1. Consultar mascotas desde Spring Boot.
 * 2. Consultar propietarios desde MySQL.
 * 3. Buscar mascotas.
 * 4. Mostrar mascotas con paginación.
 * 5. Abrir el formulario para crear mascotas.
 * 6. Abrir el formulario para editar mascotas.
 * 7. Seleccionar propietarios.
 * 8. Guardar nuevas mascotas en MySQL.
 *
 * IMPORTANTE:
 * La creación está implementada.
 * La actualización de mascotas se implementará después.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Component } from '@angular/core';

import {
  CommonModule,
  formatDate
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

// Librería para mostrar alertas.
import Swal from 'sweetalert2';

// Ventanas modales de Bootstrap.
import { Modal } from 'bootstrap';

// Servicio y DTO para gestionar mascotas.
import {
  MascotaService,
  CrearMascotaDTO
} from './service/mascota.service';

// Modelo de mascota.
import { Mascota } from 'src/app/models/mascota';

// Servicio para consultar propietarios.
import { ClienteService } from 'src/app/services/cliente.service';

// Modelo de cliente.
import { Cliente } from 'src/app/models/cliente';


// ==========================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({

  selector: 'app-mascota',

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './mascota.component.html',

  styleUrl: './mascota.component.scss'

})

export class MascotaComponent {

  // ========================================================
  // 3. VARIABLES DEL MODAL
  // ========================================================

  // Instancia del modal Bootstrap.
  modalInstance: Modal | null = null;

  // Título de la ventana.
  titleModal: string = '';

  // C = Crear, E = Editar.
  modoFormulario: string = '';

  // Texto del botón principal.
  titleBoton: string = '';


  // ========================================================
  // 4. LISTAS DE MASCOTAS Y CLIENTES
  // ========================================================

  // Mascotas obtenidas desde Spring Boot.
  listMascotas: Mascota[] = [];

  // Propietarios obtenidos desde Spring Boot.
  listClientes: Cliente[] = [];


  // ========================================================
  // 5. BÚSQUEDA Y PAGINACIÓN
  // ========================================================

  // Texto utilizado para buscar mascotas.
  terminoBusqueda: string = '';

  // Página actual de la tabla.
  paginaActual: number = 1;

  // Cantidad de registros por página.
  readonly registrosPorPagina: number = 10;


  // ========================================================
  // 6. FORMULARIO
  // ========================================================

  // Formulario reactivo.
  form!: FormGroup;

  // Mascota seleccionada para editar.
  mascotaSelected: Mascota | null = null;

  // Evita enviar el formulario varias veces.
  guardando: boolean = false;


  // ========================================================
  // 7. CONSTRUCTOR
  // ========================================================

  constructor(

    private readonly mascotaService: MascotaService,

    private readonly formBuilder: FormBuilder,

    private readonly clienteService: ClienteService

  ) {

    // Crear los controles del formulario.
    this.inicializarFormulario();

    // Consultar mascotas.
    this.listar();

    // Consultar propietarios.
    this.listarClientes();

  }


  // ========================================================
  // 8. CONSULTAR PROPIETARIOS
  // ========================================================

  /**
   * Obtiene los clientes registrados desde Spring Boot.
   *
   * Se utilizan para llenar el selector
   * de propietarios del formulario.
   */
  listarClientes(): void {

    this.clienteService.listarClientes().subscribe({

      next: (data: Cliente[]) => {

        // Almacenar propietarios.
        this.listClientes = data;

        console.log(
          'Clientes cargados:',
          data
        );

      },

      error: (error) => {

        console.error(
          'Error al cargar clientes:',
          error
        );

      }

    });

  }


  // ========================================================
  // 9. COMPARAR CLIENTES
  // ========================================================

  /**
   * Compara dos propietarios mediante clienteId.
   *
   * Es necesario porque el selector HTML
   * almacena objetos Cliente completos.
   *
   * Se utiliza desde:
   *
   * [compareWith]="compararClientes"
   */
  compararClientes = (

    cliente1: Cliente | null,

    cliente2: Cliente | null

  ): boolean => {

    // Ambos son el mismo objeto.
    if (cliente1 === cliente2) {

      return true;

    }

    // Uno de los clientes es null.
    if (!cliente1 || !cliente2) {

      return false;

    }

    // Comparar utilizando el identificador.
    return (

      cliente1.clienteId != null &&

      String(cliente1.clienteId) ===
      String(cliente2.clienteId)

    );

  };


  // ========================================================
  // 10. INICIALIZAR FORMULARIO
  // ========================================================

  /**
   * Crea todos los campos del formulario
   * y sus respectivas validaciones.
   */
  inicializarFormulario(): void {

    this.form = this.formBuilder.group({

      // Nombre de la mascota.
      nombreMascota: [

        '',

        [
          Validators.required,
          Validators.maxLength(100)
        ]

      ],

      // Edad de la mascota.
      edad: [

        null,

        [
          Validators.required,
          Validators.min(0)
        ]

      ],

      // ID de raza.
      raza: [

        null,

        [
          Validators.required,
          Validators.min(1)
        ]

      ],

      // Objeto Cliente completo.
      cliente: [

        null,

        Validators.required

      ]

    });

  }


  // ========================================================
  // 11. OBTENER LOS CONTROLES
  // ========================================================

  /**
   * Permite acceder a los controles
   * del formulario desde el HTML.
   */
  get f(): {
    [key: string]: AbstractControl
  } {

    return this.form.controls;

  }


  // ========================================================
  // 12. LISTAR MASCOTAS
  // ========================================================

  /**
   * Consulta mascotas con:
   *
   * - Nombre
   * - Edad
   * - Fecha de registro
   * - Raza
   * - Especie
   * - Propietario
   *
   * Endpoint:
   * GET /mascota/listar-detalle
   */
  listar(): void {

    this.mascotaService.listarMascotas().subscribe({

      next: (data: Mascota[]) => {

        // Actualizar el listado.
        this.listMascotas = data;

        // Reiniciar paginación.
        this.paginaActual = 1;

        console.log(
          'Mascotas cargadas:',
          data
        );

      },

      error: (error) => {

        console.error(
          'Error al obtener las mascotas:',
          error
        );

      }

    });

  }


  // ========================================================
  // 13. FILTRAR MASCOTAS
  // ========================================================

  /**
   * Permite buscar mascotas por:
   *
   * - Nombre
   * - Edad
   * - Raza
   * - Especie
   * - Propietario
   * - Fecha
   */
  get mascotasFiltradas(): Mascota[] {

    // Obtener texto de búsqueda.
    const termino = this.normalizarTexto(

      this.terminoBusqueda.trim()

    );

    // Sin búsqueda: mostrar todas.
    if (!termino) {

      return this.listMascotas;

    }

    // Filtrar la lista.
    return this.listMascotas.filter(

      (mascota) => {

        const valores = [

          // Nombre.
          mascota.nombreMascota,

          // Especie.
          mascota.raza?.especie,

          // Raza.
          mascota.raza?.nombre,

          // Edad.
          mascota.edad,

          // Propietario.
          `${
            mascota.cliente?.nombres ?? ''
          } ${
            mascota.cliente?.apellidos ?? ''
          }`,

          // Fecha.
          mascota.fechaRegistro
            ? formatDate(
                mascota.fechaRegistro,
                'yyyy-MM-dd HH:mm',
                'en-US'
              )
            : ''

        ];

        // Comprobar coincidencias.
        return valores.some(

          (valor) => {

            return this.normalizarTexto(

              String(valor ?? '')

            ).includes(termino);

          }

        );

      }

    );

  }


  // ========================================================
  // 14. NORMALIZAR TEXTO
  // ========================================================

  /**
   * Convierte el texto a minúsculas
   * y elimina tildes.
   *
   * Ejemplo:
   * "MÁX" -> "max"
   */
  private normalizarTexto(
    texto: string
  ): string {

    return texto

      .toLocaleLowerCase()

      .normalize('NFD')

      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

  }


  // ========================================================
  // 15. ACTUALIZAR BÚSQUEDA
  // ========================================================

  /**
   * Se ejecuta cuando el usuario
   * escribe en el buscador.
   */
  actualizarBusqueda(
    event: Event
  ): void {

    this.terminoBusqueda = (

      event.target as HTMLInputElement

    ).value;

    // Regresar a la primera página.
    this.paginaActual = 1;

  }


  // ========================================================
  // 16. PAGINACIÓN DE MASCOTAS
  // ========================================================

  /**
   * Muestra solamente los registros
   * correspondientes a la página actual.
   */
  get mascotasPaginadas(): Mascota[] {

    const inicio = (

      this.paginaActual - 1

    ) * this.registrosPorPagina;

    return this.mascotasFiltradas.slice(

      inicio,

      inicio + this.registrosPorPagina

    );

  }


  // ========================================================
  // 17. CALCULAR TOTAL DE PÁGINAS
  // ========================================================

  get totalPaginas(): number {

    return Math.ceil(

      this.mascotasFiltradas.length /

      this.registrosPorPagina

    );

  }


  // ========================================================
  // 18. GENERAR NÚMEROS DE PÁGINAS
  // ========================================================

  /**
   * Ejemplo:
   *
   * Si hay 21 mascotas:
   * [1, 2, 3]
   */
  get paginas(): number[] {

    return Array.from(

      {
        length: this.totalPaginas
      },

      (_, indice) => indice + 1

    );

  }


  // ========================================================
  // 19. CAMBIAR DE PÁGINA
  // ========================================================

  cambiarPagina(
    pagina: number
  ): void {

    if (

      pagina >= 1 &&

      pagina <= this.totalPaginas

    ) {

      this.paginaActual = pagina;

    }

  }


  // ========================================================
  // 20. CREAR NUEVA MASCOTA
  // ========================================================

  /**
   * Se ejecuta al pulsar Nuevo.
   *
   * Limpia el formulario y abre
   * la ventana de creación.
   */
  nuevaMascota(
    modo: string
  ): void {

    // No estamos editando.
    this.mascotaSelected = null;

    // Limpiar campos.
    this.resetFormulario();

    // Abrir modal.
    this.openModal(modo);

  }


  // ========================================================
  // 21. ABRIR EDICIÓN
  // ========================================================

  /**
   * Carga los datos de una mascota
   * dentro del formulario.
   */
  abrirEdicion(
    mascota: Mascota
  ): void {

    // Guardar mascota seleccionada.
    this.mascotaSelected = mascota;

    // Colocar sus datos en el formulario.
    this.form.patchValue({

      nombreMascota:
        mascota.nombreMascota ?? '',

      edad:
        mascota.edad ?? null,

      // Obtener ID de raza.
      raza:
        mascota.raza?.id ?? null,

      // Objeto Cliente completo.
      cliente:
        mascota.cliente ?? null

    });

    // Abrir en modo edición.
    this.openModal('E');

  }


  // ========================================================
  // 22. REINICIAR FORMULARIO
  // ========================================================

  /**
   * Limpia todos los controles
   * y elimina validaciones visuales.
   */
  resetFormulario(): void {

    this.form.reset({

      nombreMascota: '',

      edad: null,

      raza: null,

      cliente: null

    });

    this.form.markAsPristine();

    this.form.markAsUntouched();

  }


  // ========================================================
  // 23. ABRIR MODAL
  // ========================================================

  /**
   * Configura la ventana según el modo:
   *
   * C: Crear Mascota.
   * E: Editar Mascota.
   */
  openModal(
    modo: string
  ): void {

    this.modoFormulario = modo;

    // Cambiar título.
    this.titleModal =

      modo === 'C'

        ? 'Crear Mascota'

        : 'Editar Mascota';

    // Cambiar texto del botón.
    this.titleBoton =

      modo === 'C'

        ? 'Guardar Mascota'

        : 'Actualizar Mascota';

    // Buscar el modal en el HTML.
    const modalElement =

      document.getElementById(
        'modalCrearMascota'
      );

    if (modalElement) {

      // Crear o reutilizar modal.
      this.modalInstance ??=

        new Modal(modalElement);

      // Mostrar modal.
      this.modalInstance.show();

    }

  }


  // ========================================================
  // 24. CERRAR MODAL
  // ========================================================

  /**
   * Cierra el formulario
   * y limpia la selección.
   */
  closeModal(): void {

    if (this.modalInstance) {

      this.modalInstance.hide();

    }

    // Limpiar formulario.
    this.resetFormulario();

    // Eliminar selección.
    this.mascotaSelected = null;

  }


  // ========================================================
  // 25. GUARDAR MASCOTA EN MYSQL
  // ========================================================

  /**
   * REGISTRAR NUEVA MASCOTA
   *
   * 1. Validar formulario.
   * 2. Obtener objeto Cliente.
   * 3. Extraer clienteId.
   * 4. Preparar los datos.
   * 5. Enviar POST a Spring Boot.
   * 6. Mostrar confirmación.
   * 7. Actualizar la tabla.
   */
  guardarMascota(): void {

    // ------------------------------------------------------
    // PASO 1. IMPEDIR PETICIONES DUPLICADAS
    // ------------------------------------------------------

    if (this.guardando) {

      return;

    }

    // ------------------------------------------------------
    // PASO 2. VALIDAR EL FORMULARIO
    // ------------------------------------------------------

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      Swal.fire({

        icon: 'warning',

        title: 'Formulario incompleto',

        text: 'Completa todos los campos correctamente.'

      });

      return;

    }

    // ------------------------------------------------------
    // PASO 3. COMPROBAR MODO DEL FORMULARIO
    // ------------------------------------------------------

    // El endpoint para actualizar todavía no existe.
    if (this.modoFormulario === 'E') {

      Swal.fire({

        icon: 'info',

        title: 'Actualización pendiente',

        text: 'Por ahora solamente está disponible el registro de nuevas mascotas.'

      });

      return;

    }

    // ------------------------------------------------------
    // PASO 4. OBTENER VALORES
    // ------------------------------------------------------

    const valores = this.form.value;

    // ------------------------------------------------------
    // PASO 5. OBTENER PROPIETARIO SELECCIONADO
    // ------------------------------------------------------

    /**
     * IMPORTANTE:
     *
     * El formulario guarda un objeto Cliente.
     *
     * Por ejemplo:
     *
     * {
     *   clienteId: 2,
     *   nombres: 'María',
     *   apellidos: 'Gómez Rodríguez'
     * }
     *
     * No debemos convertir directamente
     * todo el objeto a número.
     */

    const clienteSeleccionado: Cliente | null =

      valores.cliente;

    // Extraer únicamente el identificador.
    const clienteId = Number(

      clienteSeleccionado?.clienteId

    );

    // ------------------------------------------------------
    // PASO 6. VALIDAR EL PROPIETARIO
    // ------------------------------------------------------

    if (

      !clienteSeleccionado ||

      !Number.isInteger(clienteId) ||

      clienteId <= 0

    ) {

      Swal.fire({

        icon: 'warning',

        title: 'Propietario inválido',

        text: 'Selecciona un propietario válido.'

      });

      return;

    }

    // ------------------------------------------------------
    // PASO 7. PREPARAR LOS DATOS
    // ------------------------------------------------------

    const datos: CrearMascotaDTO = {

      nombreMascota: String(

        valores.nombreMascota ?? ''

      ).trim(),

      edad: Number(
        valores.edad
      ),

      razaId: Number(
        valores.raza
      ),

      // CORRECCIÓN PRINCIPAL:
      // Enviar el ID, no el objeto completo.
      clienteId: clienteId

    };

    // ------------------------------------------------------
    // PASO 8. VALIDAR DATOS ADICIONALES
    // ------------------------------------------------------

    if (

      !datos.nombreMascota ||

      !Number.isInteger(datos.edad) ||

      datos.edad < 0 ||

      !Number.isInteger(datos.razaId) ||

      datos.razaId <= 0

    ) {

      Swal.fire({

        icon: 'warning',

        title: 'Datos inválidos',

        text: 'Verifica el nombre, la edad y la raza.'

      });

      return;

    }

    // ------------------------------------------------------
    // PASO 9. MOSTRAR DATOS EN CONSOLA
    // ------------------------------------------------------

    console.log(

      'Datos enviados a Spring Boot:',

      datos

    );

    // ------------------------------------------------------
    // PASO 10. ENVIAR PETICIÓN POST
    // ------------------------------------------------------

    this.guardando = true;

    this.mascotaService.crearMascota(

      datos

    ).subscribe({

      // ----------------------------------------------------
      // RESPUESTA CORRECTA DEL BACKEND
      // ----------------------------------------------------

      next: (mascota: Mascota) => {

        // Permitir otro guardado.
        this.guardando = false;

        console.log(

          'Mascota registrada:',

          mascota

        );

        // Cerrar formulario.
        this.closeModal();

        // Actualizar listado.
        this.listar();

        // Mostrar confirmación.
        Swal.fire({

          icon: 'success',

          title: 'Mascota registrada',

          text:

            `La mascota ${mascota.nombreMascota} ` +

            'se guardó correctamente.'

        });

      },

      // ----------------------------------------------------
      // ERROR DEL BACKEND
      // ----------------------------------------------------

      error: (error) => {

        // Permitir volver a intentar.
        this.guardando = false;

        // Mostrar error técnico.
        console.error(

          'Error al guardar mascota:',

          error

        );

        // Mostrar mensaje al usuario.
        Swal.fire({

          icon: 'error',

          title: 'Error al guardar',

          text:

            error.error?.message ||

            'No fue posible registrar la mascota. Revisa los datos enviados.'

        });

      }

    });

  }

}
