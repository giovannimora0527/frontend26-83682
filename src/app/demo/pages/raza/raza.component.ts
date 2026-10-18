
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
export class RazaComponent implements OnInit {

  // Lista original de razas recibida desde MySQL.
  razas: RazaRegistro[] = [];

  // Texto ingresado en el buscador.
  textoBusqueda: string = '';

  // Indica cuándo se están cargando los registros.
  cargando: boolean = false;

  // Guarda un mensaje si falla la petición HTTP.
  errorCarga: string = '';

  // 4. CONSTRUCTOR
  constructor(
    private readonly razaService: RazaService
  ) {}

  // 5. INICIALIZACIÓN
  ngOnInit(): void {

    // Consultar las razas cuando se abre la pantalla.
    this.cargarRazas();

  }

  // 6. CONSULTAR RAZAS EN SPRING BOOT
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
  limpiarBusqueda(): void {

    this.textoBusqueda = '';

  }

}
