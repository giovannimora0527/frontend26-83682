
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * GESTIÓN DE ESPECIALIZACIONES
 * ==========================================================
 *
 * Consulta, muestra y permite buscar
 * las especializaciones registradas.
 */

// 1. IMPORTACIONES
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TarifarioComponent } from './tarifario.component';

import {
  Especializacion,
  EspecializacionService
} from 'src/app/services/especializacion.service';

// 2. COMPONENTE ANGULAR
@Component({
  selector: 'app-especializacion',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule, TarifarioComponent
  ],

  templateUrl: './especializacion.component.html',
  styleUrl: './especializacion.component.scss'
})
/** Pantalla «especialización» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
export class EspecializacionComponent implements OnInit {
  /** Indica si es admin. */
  readonly esAdmin = ['ADMIN', 'ADMINISTRADOR'].includes((inject(AuthService).obtenerPerfil() ?? '').trim().toUpperCase());


  // 3. VARIABLES PRINCIPALES

  // Especializaciones recibidas desde MySQL.
  /** Lista de especializaciones. */
  especializaciones: Especializacion[] = [];

  // Texto utilizado en las búsquedas.
  /** Criterio de filtrado: texto búsqueda. */
  textoBusqueda: string = '';

  // Controla el mensaje de carga.
  /** Indica si se está cargando. */
  cargando: boolean = false;

  // Guarda los errores de conexión.
  /** Mensaje mostrado al usuario (error carga). */
  errorCarga: string = '';

  // 4. CONSTRUCTOR
  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param especializacionService servicio especialización.
   */
  constructor(
    /** Dependencia inyectada (EspecializacionService). */
    private readonly especializacionService: EspecializacionService
  ) {}

  // 5. INICIALIZACIÓN
  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit(): void {
    if (this.esAdmin) return;

    // Consultar las especializaciones al abrir.
    this.cargarEspecializaciones();

  }

  // 6. CONSULTAR ESPECIALIZACIONES
  /** Carga especializaciones desde el backend. */
  cargarEspecializaciones(): void {

    this.cargando = true;
    this.errorCarga = '';

    this.especializacionService
      .listarEspecializaciones()
      .subscribe({

        // Solicitud correcta.
        next: (respuesta: Especializacion[]) => {

          this.especializaciones = respuesta ?? [];

          this.cargando = false;

          console.log(
            'Especializaciones cargadas:',
            this.especializaciones
          );

        },

        // Error en la comunicación con Spring Boot.
        error: (error) => {

          console.error(
            'Error cargando especializaciones:',
            error
          );

          this.errorCarga =
            'No fue posible consultar las especializaciones. ' +
            'Verifica que Spring Boot esté funcionando.';

          this.cargando = false;

        }

      });

  }

  // 7. FILTRAR ESPECIALIZACIONES
  /**
   * Especializaciones filtradas.
   *
   * @returns resultado de especializaciones filtradas.
   */
  get especializacionesFiltradas(): Especializacion[] {

    const busqueda = this.textoBusqueda
      .trim()
      .toLowerCase();

    // Mostrar todas si no se ha escrito nada.
    if (!busqueda) {
      return this.especializaciones;
    }

    // Buscar por ID, nombre, código o descripción.
    return this.especializaciones.filter(item => {

      const contenido = [
        item.id,
        item.nombre,
        item.codigoEspecializacion,
        item.descripcion ?? ''
      ]
        .map(valor => String(valor))
        .join(' ')
        .toLowerCase();

      return contenido.includes(busqueda);

    });

  }

  // 8. LIMPIAR LA BÚSQUEDA
  /** Limpia búsqueda. */
  limpiarBusqueda(): void {

    this.textoBusqueda = '';

  }

}
