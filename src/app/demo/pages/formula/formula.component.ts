
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE FÓRMULAS MÉDICAS
 * ==========================================================
 *
 * Funcionalidades:
 *
 * 1. Consultar fórmulas médicas desde Spring Boot.
 * 2. Mostrar los registros obtenidos de MySQL.
 * 3. Buscar fórmulas por ID, dosis o indicaciones.
 * 4. Mostrar mensajes de carga y errores.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

// Modelo de fórmulas médicas.
import { FormulaMedica } from '../../../models/formula-medica';

// Servicio que consulta el backend.
import { FormulaMedicaService } from '../../../services/formula-medica.service';

// ==========================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({
  selector: 'app-formula',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './formula.component.html',

  styleUrls: ['./formula.component.scss']
})

// ==========================================================
// 3. CLASE PRINCIPAL
// ==========================================================

export class FormulaComponent implements OnInit {

  // ========================================================
  // 4. VARIABLES
  // ========================================================

  // Almacena todas las fórmulas recibidas desde MySQL.
  formulasMedicas: FormulaMedica[] = [];

  // Texto ingresado en el buscador.
  textoBusqueda: string = '';

  // Indica que la consulta está en proceso.
  cargando: boolean = false;

  // Mensaje mostrado si ocurre un problema.
  mensajeError: string = '';

  // ========================================================
  // 5. CONSTRUCTOR
  // ========================================================

  constructor(
    private formulaMedicaService: FormulaMedicaService
  ) {}

  // ========================================================
  // 6. INICIALIZACIÓN
  // ========================================================

  ngOnInit(): void {

    // Consultar automáticamente las fórmulas médicas.
    this.cargarFormulasMedicas();

  }

  // ========================================================
  // 7. CONSULTAR FÓRMULAS MÉDICAS
  // ========================================================

  cargarFormulasMedicas(): void {

    // Activar indicador de carga.
    this.cargando = true;

    // Limpiar errores anteriores.
    this.mensajeError = '';

    this.formulaMedicaService
      .listarFormulasMedicas()
      .subscribe({

        // La consulta terminó correctamente.
        next: (respuesta: FormulaMedica[]) => {

          // Guardar los registros recibidos.
          this.formulasMedicas = respuesta;

          // Finalizar la carga.
          this.cargando = false;

          // Mostrar los datos en la consola.
          console.log(
            'Fórmulas médicas cargadas:',
            this.formulasMedicas
          );

        },

        // Ocurrió un error en la consulta.
        error: (error) => {

          console.error(
            'Error al consultar fórmulas médicas:',
            error
          );

          this.mensajeError =
            'No fue posible consultar las fórmulas médicas.';

          this.cargando = false;

        }

      });

  }

  // ========================================================
  // 8. FILTRAR FÓRMULAS MÉDICAS
  // ========================================================

  get formulasFiltradas(): FormulaMedica[] {

    // Convertir la búsqueda a minúsculas.
    const busqueda = this.textoBusqueda
      .toLowerCase()
      .trim();

    // Si no hay búsqueda, mostrar todos los registros.
    if (!busqueda) {
      return this.formulasMedicas;
    }

    // Filtrar por ID, cita, medicamento,
    // dosis o indicaciones.
    return this.formulasMedicas.filter(formula => {

      return (
        String(formula.id).includes(busqueda) ||

        String(formula.citaId).includes(busqueda) ||

        String(formula.medicamentoId).includes(busqueda) ||

        formula.dosis
          .toLowerCase()
          .includes(busqueda) ||

        (formula.indicaciones || '')
          .toLowerCase()
          .includes(busqueda)
      );

    });

  }

  // ========================================================
  // 9. LIMPIAR BÚSQUEDA
  // ========================================================

  limpiarBusqueda(): void {

    this.textoBusqueda = '';

  }

}
