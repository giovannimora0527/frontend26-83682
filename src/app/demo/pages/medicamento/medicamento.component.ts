
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * COMPONENTE DE GESTIÓN DE MEDICAMENTOS
 * ==========================================================
 *
 * Funcionalidades:
 *
 * 1. Consultar medicamentos desde Spring Boot.
 * 2. Mostrar los medicamentos registrados.
 * 3. Buscar por ID, nombre, descripción o presentación.
 * 4. Mostrar fechas de compra y vencimiento.
 * 5. Informar si ocurre un error de conexión.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================
// Permite utilizar *ngIf y *ngFor en el HTML.
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit
} from '@angular/core';

// Servicio encargado de comunicarse con Spring Boot.
import { MedicamentoService } from
  'src/app/services/medicamento.service';

// Modelo de los medicamentos.
import { Medicamento } from
  'src/app/models/medicamento';

// ==========================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================================

@Component({
  selector: 'app-medicamento',

  // Habilita *ngIf y *ngFor en este componente.
  imports: [CommonModule],

  // Archivo HTML del componente.
  templateUrl: './medicamento.component.html',

  // Archivo de estilos.
  styleUrls: ['./medicamento.component.scss']
})
export class MedicamentoComponent implements OnInit {

  // ========================================================
  // 3. VARIABLES
  // ========================================================

  // Lista original de medicamentos.
  medicamentos: Medicamento[] = [];

  // Lista que se mostrará después de aplicar el buscador.
  medicamentosFiltrados: Medicamento[] = [];

  // Texto que el usuario escribe en el buscador.
  textoBusqueda = '';

  // Indica si los datos se están consultando.
  cargando = false;

  // Mensaje para errores de conexión.
  mensajeError = '';

  // ========================================================
  // 4. CONSTRUCTOR
  // ========================================================

  constructor(
    private readonly medicamentoService: MedicamentoService
  ) {}

  // ========================================================
  // 5. INICIALIZACIÓN
  // ========================================================

  /**
   * Se ejecuta automáticamente cuando
   * se abre la pantalla de medicamentos.
   */
  ngOnInit(): void {

    // Consultar medicamentos al abrir el componente.
    this.cargarMedicamentos();

  }

  // ========================================================
  // 6. CONSULTAR MEDICAMENTOS
  // ========================================================

  cargarMedicamentos(): void {

    // Activar indicador de carga.
    this.cargando = true;

    // Limpiar posibles errores anteriores.
    this.mensajeError = '';

    // Llamar al servicio HTTP.
    this.medicamentoService
      .listarMedicamentos()
      .subscribe({

        // Se ejecuta cuando el backend responde.
        next: (respuesta: Medicamento[]) => {

          // Guardar los medicamentos recibidos.
          this.medicamentos = respuesta;

          // Aplicar el filtro actual.
          this.filtrarMedicamentos();

          // Finalizar la carga.
          this.cargando = false;

          // Mostrar los datos en la consola.
          console.log(
            'Medicamentos cargados:',
            this.medicamentos
          );

        },

        // Se ejecuta si ocurre algún error.
        error: (error) => {

          console.error(
            'Error al consultar medicamentos:',
            error
          );

          this.medicamentos = [];
          this.medicamentosFiltrados = [];

          this.mensajeError =
            'No fue posible cargar los medicamentos. ' +
            'Verifica que el backend esté funcionando.';

          this.cargando = false;

        }

      });

  }

  // ========================================================
  // 7. CAPTURAR BÚSQUEDA
  // ========================================================

  /**
   * Recibe el texto escrito en el buscador.
   */
  buscarMedicamento(evento: Event): void {

    const input = evento.target as HTMLInputElement;

    this.textoBusqueda = input.value;

    // Actualizar la tabla.
    this.filtrarMedicamentos();

  }

  // ========================================================
  // 8. FILTRAR MEDICAMENTOS
  // ========================================================

  /**
   * Filtra los medicamentos por:
   *
   * - ID
   * - Nombre
   * - Descripción
   * - Presentación
   */
  filtrarMedicamentos(): void {

    const busqueda = this.textoBusqueda
      .trim()
      .toLowerCase();

    // Si no hay texto, mostrar todos los registros.
    if (busqueda === '') {

      this.medicamentosFiltrados = [
        ...this.medicamentos
      ];

      return;

    }

    // Buscar coincidencias en los medicamentos.
    this.medicamentosFiltrados =
      this.medicamentos.filter((medicamento) => {

        const id = String(medicamento.id);

        const nombre = medicamento.nombre
          .toLowerCase();

        const descripcion = (
          medicamento.descripcion ?? ''
        ).toLowerCase();

        const presentacion = (
          medicamento.presentacion ?? ''
        ).toLowerCase();

        return (
          id.includes(busqueda) ||
          nombre.includes(busqueda) ||
          descripcion.includes(busqueda) ||
          presentacion.includes(busqueda)
        );

      });

  }

  // ========================================================
  // 9. LIMPIAR BÚSQUEDA
  // ========================================================

  limpiarBusqueda(): void {

    // Limpiar el texto.
    this.textoBusqueda = '';

    // Mostrar nuevamente todos los medicamentos.
    this.filtrarMedicamentos();

  }

  // ========================================================
  // 10. FORMATEAR FECHAS
  // ========================================================

  /**
   * Convierte una fecha recibida desde MySQL
   * al formato día/mes/año.
   *
   * Ejemplo:
   * 2026-06-01 -> 01/06/2026
   */
  formatearFecha(fecha: string | null | undefined): string {

    // Verificar que la fecha tenga un valor.
    if (!fecha) {
      return 'Sin fecha';
    }

    // Obtener solamente la fecha, sin la hora.
    const fechaSinHora = fecha.split('T')[0];

    // Separar año, mes y día.
    const partes = fechaSinHora.split('-');

    // Si la fecha no tiene el formato esperado,
    // devolver el valor original.
    if (partes.length !== 3) {
      return fecha;
    }

    const [anio, mes, dia] = partes;

    // Devolver la fecha en formato colombiano.
    return `${dia}/${mes}/${anio}`;

  }

}
