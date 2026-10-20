
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE HISTORIAS MÉDICAS
 * ==========================================================
 *
 * Funcionalidades:
 * 1. Consultar todas las historias médicas.
 * 2. Buscar historias por paciente.
 * 3. Mostrar mensajes de carga y errores.
 * 4. Limpiar los filtros de búsqueda.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

// Modelo de historia médica.
import { HistoriaMedica } from '../../../models/historia-medica';

// Servicio que conecta con Spring Boot.
import { HistoriaMedicaService } from '../../../services/historia-medica.service';

// ==========================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({
  selector: 'app-historia-medica',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './historia-medica.component.html',

  styleUrls: ['./historia-medica.component.scss']
})

// ==========================================================
// 3. COMPONENTE PRINCIPAL
// ==========================================================

export class HistoriaMedicaComponent implements OnInit {

  // ========================================================
  // 4. VARIABLES
  // ========================================================

  // Almacena las historias recibidas desde MySQL.
  historiasMedicas: HistoriaMedica[] = [];

  // Identificador del paciente que deseamos consultar.
  pacienteBusqueda: number | null = null;

  // Indica si se está realizando una consulta.
  cargando: boolean = false;

  // Almacena un mensaje cuando ocurre un error.
  mensajeError: string = '';

  // ========================================================
  // 5. CONSTRUCTOR
  // ========================================================

  constructor(
    private historiaMedicaService: HistoriaMedicaService
  ) {}

  // ========================================================
  // 6. INICIALIZACIÓN
  // ========================================================

  ngOnInit(): void {

    // Consultar al abrir la página.
    this.cargarHistoriasMedicas();

  }

  // ========================================================
  // 7. LISTAR TODAS LAS HISTORIAS MÉDICAS
  // ========================================================

  cargarHistoriasMedicas(): void {

    this.cargando = true;

    this.mensajeError = '';

    this.historiaMedicaService
      .listarHistoriasMedicas()
      .subscribe({

        // Consulta exitosa.
        next: (respuesta: HistoriaMedica[]) => {

          this.historiasMedicas = respuesta;

          this.cargando = false;

          console.log(
            'Historias médicas cargadas:',
            respuesta
          );

        },

        // Error de comunicación con Spring Boot.
        error: (error) => {

          console.error(
            'Error al consultar historias médicas:',
            error
          );

          this.mensajeError =
            'No fue posible consultar las historias médicas.';

          this.cargando = false;

        }

      });

  }

  // ========================================================
  // 8. BUSCAR HISTORIAS POR PACIENTE
  // ========================================================

  buscarPorPaciente(): void {

    // Validar que se haya ingresado un ID correcto.
    if (
      this.pacienteBusqueda === null ||
      !Number.isInteger(this.pacienteBusqueda) ||
      this.pacienteBusqueda <= 0
    ) {

      this.mensajeError =
        'Ingresa un ID de paciente válido.';

      return;

    }

    this.cargando = true;

    this.mensajeError = '';

    this.historiaMedicaService
      .listarHistoriasPorPaciente(this.pacienteBusqueda)
      .subscribe({

        next: (respuesta: HistoriaMedica[]) => {

          this.historiasMedicas = respuesta;

          this.cargando = false;

        },

        error: (error) => {

          console.error(
            'Error al buscar historias por paciente:',
            error
          );

          this.mensajeError =
            'No fue posible consultar las historias del paciente.';

          this.cargando = false;

        }

      });

  }

  // ========================================================
  // 9. LIMPIAR FILTROS
  // ========================================================

  limpiarBusqueda(): void {

    // Borrar el identificador del paciente.
    this.pacienteBusqueda = null;

    // Consultar nuevamente todos los registros.
    this.cargarHistoriasMedicas();

  }

}
