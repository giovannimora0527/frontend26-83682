
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE RAZAS
 * ==========================================================
 *
 * Permite consultar y buscar las razas
 * registradas en la base de datos MySQL.
 */

// 1. IMPORTACIONES DE ANGULAR
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. SERVICIO Y MODELO DE RAZAS
import {
  RazaService,
  RazaRegistro
} from 'src/app/services/raza.service';

// 3. CONFIGURACIÓN DEL COMPONENTE
@Component({
  selector: 'app-raza',
  standalone: true,

  // Módulos para tablas, condiciones y formularios.
  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './raza.component.html',
  styleUrl: './raza.component.scss'
})
/** Pantalla «raza» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
export class RazaComponent implements OnInit {

  // Lista original de razas recibida desde MySQL.
  /** Lista de razas. */
  razas: RazaRegistro[] = [];

  // Texto ingresado en el buscador.
  /** Criterio de filtrado: texto búsqueda. */
  textoBusqueda: string = '';

  // Indica cuándo se están cargando los registros.
  /** Indica si se está cargando. */
  cargando: boolean = false;

  // Guarda un mensaje si falla la petición HTTP.
  /** Mensaje mostrado al usuario (error carga). */
  errorCarga: string = '';

  // 4. CONSTRUCTOR
  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param razaService servicio raza.
   */
  constructor(
    /** Dependencia inyectada (RazaService). */
    private readonly razaService: RazaService
  ) {}

  // 5. INICIALIZACIÓN
  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit(): void {

    // Consultar las razas cuando se abre la pantalla.
    this.cargarRazas();

  }

  // 6. CONSULTAR RAZAS EN SPRING BOOT
  /** Carga razas desde el backend. */
  cargarRazas(): void {

    this.cargando = true;
    this.errorCarga = '';

    this.razaService.listarRazas().subscribe({

      // Respuesta correcta del backend.
      next: (respuesta: RazaRegistro[]) => {

        this.razas = respuesta ?? [];
        this.cargando = false;

        console.log(
          'Razas cargadas desde MySQL:',
          this.razas
        );

      },

      // Error en la consulta.
      error: (error) => {

        console.error(
          'Error al consultar las razas:',
          error
        );

        this.errorCarga =
          'No fue posible consultar las razas. ' +
          'Verifica que Spring Boot esté funcionando.';

        this.cargando = false;

      }

    });

  }

  // 7. FILTRAR RAZAS
  /**
   * Razas filtradas.
   *
   * @returns resultado de razas filtradas.
   */
  get razasFiltradas(): RazaRegistro[] {

    // Convertir el texto a minúsculas.
    const buscar = this.textoBusqueda
      .trim()
      .toLowerCase();

    // Si el buscador está vacío, mostrar todas.
    if (!buscar) {
      return this.razas;
    }

    // Buscar coincidencias por ID, nombre o especie.
    return this.razas.filter(raza => {

      const contenido = [
        raza.razaId,
        raza.nombre,
        raza.especie
      ]
        .map(valor => String(valor ?? ''))
        .join(' ')
        .toLowerCase();

      return contenido.includes(buscar);

    });

  }

  // 8. LIMPIAR BÚSQUEDA
  /** Limpia búsqueda. */
  limpiarBusqueda(): void {

    this.textoBusqueda = '';

  }

}
