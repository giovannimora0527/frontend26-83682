
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE ANOTACIONES
 * ==========================================================
 *
 * Funcionalidades:
 *
 * 1. Consultar todas las anotaciones desde Spring Boot.
 * 2. Mostrar los registros de MySQL.
 * 3. Buscar por ID, historia, médico o descripción.
 * 4. Mostrar errores y mensajes de carga.
 * 5. Limpiar el buscador.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

// Modelo que representa una anotación médica.
import { AnotacionHistoria } from '../../../models/anotacion-historia';

// Servicio encargado de consultar Spring Boot.
import { AnotacionHistoriaService } from '../../../services/anotacion-historia.service';

// ==========================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({
  selector: 'app-anotacion-historia',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './anotacion-historia.component.html',

  styleUrls: ['./anotacion-historia.component.scss']
})

// ==========================================================
// 3. COMPONENTE PRINCIPAL
// ==========================================================

export class AnotacionHistoriaComponent implements OnInit {

  // ========================================================
  // 4. VARIABLES
  // ========================================================

  // Guarda las anotaciones recibidas desde MySQL.
  anotaciones: AnotacionHistoria[] = [];

  // Texto ingresado por el usuario para buscar.
  textoBusqueda: string = '';

  // Indica si estamos consultando los datos.
  cargando: boolean = false;

  // Mensaje mostrado cuando ocurre un error.
  mensajeError: string = '';

  // ========================================================
  // 5. CONSTRUCTOR
  // ========================================================

  constructor(
    private anotacionHistoriaService: AnotacionHistoriaService
  ) {}

  // ========================================================
  // 6. INICIALIZACIÓN
  // ========================================================

  ngOnInit(): void {

    // Cargar las anotaciones al abrir el módulo.
    this.cargarAnotaciones();

  }

  // ========================================================
  // 7. CONSULTAR TODAS LAS ANOTACIONES
  // ========================================================

  cargarAnotaciones(): void {

    // Mostrar indicador de carga.
    this.cargando = true;

    // Limpiar errores anteriores.
    this.mensajeError = '';

    // Consultar el endpoint de Spring Boot.
    this.anotacionHistoriaService
      .listarAnotaciones()
      .subscribe({

        // La consulta se realizó correctamente.
        next: (respuesta: AnotacionHistoria[]) => {

          // Guardar los registros obtenidos.
          this.anotaciones = respuesta;

          // Finalizar la carga.
          this.cargando = false;

          // Mostrar los resultados en consola.
          console.log(
            'Anotaciones médicas cargadas:',
            respuesta
          );

        },

        // Ocurrió un error consultando el backend.
        error: (error) => {

          console.error(
            'Error al consultar anotaciones:',
            error
          );

          this.mensajeError =
            'No fue posible consultar las anotaciones médicas.';

          this.cargando = false;

        }

      });

  }

  // ========================================================
  // 8. BUSCAR ANOTACIONES
  // ========================================================

  get anotacionesFiltradas(): AnotacionHistoria[] {

    // Convertir la búsqueda a minúsculas.
    const busqueda = this.textoBusqueda
      .toLowerCase()
      .trim();

    // Si el buscador está vacío, devolver todo.
    if (!busqueda) {

      return this.anotaciones;

    }

    // Buscar por identificadores o descripción.
    return this.anotaciones.filter(anotacion => {

      return (

        String(anotacion.id).includes(busqueda) ||

        String(anotacion.historiaId).includes(busqueda) ||

        String(anotacion.medicoId).includes(busqueda) ||

        (anotacion.descripcion || '')
          .toLowerCase()
          .includes(busqueda)

      );

    });

  }

  // ========================================================
  // 9. LIMPIAR BÚSQUEDA
  // ========================================================

  limpiarBusqueda(): void {

    // Borrar el texto ingresado.
    this.textoBusqueda = '';

  }

}
