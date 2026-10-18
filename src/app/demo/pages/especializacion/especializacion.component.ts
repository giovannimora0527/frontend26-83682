
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    FormsModule
  ],

  templateUrl: './especializacion.component.html',
  styleUrl: './especializacion.component.scss'
})
export class EspecializacionComponent implements OnInit {

  // 3. VARIABLES PRINCIPALES

  // Especializaciones recibidas desde MySQL.
  especializaciones: Especializacion[] = [];

  // Texto utilizado en las búsquedas.
  textoBusqueda: string = '';

  // Controla el mensaje de carga.
  cargando: boolean = false;

  // Guarda los errores de conexión.
  errorCarga: string = '';

  // 4. CONSTRUCTOR
  constructor(
    private readonly especializacionService: EspecializacionService
  ) {}

  // 5. INICIALIZACIÓN
  ngOnInit(): void {

    // Consultar las especializaciones al abrir.
    this.cargarEspecializaciones();

  }

  // 6. CONSULTAR ESPECIALIZACIONES
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
  limpiarBusqueda(): void {

    this.textoBusqueda = '';

  }

}
