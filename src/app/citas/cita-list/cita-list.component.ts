import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cita } from '../cita.model';
import { CitaService } from '../cita.service';

/**
 * Componente que muestra las citas filtradas por un rango de fechas
 * (Requerimientos 2 y 3 del backend), ordenadas de la mas reciente a la
 * mas antigua.
 */
@Component({
  selector: 'app-cita-list',
  templateUrl: './cita-list.component.html',
  styleUrls: ['./cita-list.component.css']
})
export class CitaListComponent implements OnInit {

  /** Lista de citas traida desde el backend segun el filtro actual. */
  citas: Cita[] = [];

  /** Mensaje de error a mostrar si la peticion al backend falla. */
  mensajeError = '';

  /** Indica si la peticion al backend todavia esta en curso. */
  cargando = true;

  /** Fecha inicial del filtro, enlazada al input del formulario. */
  fechaInicio = '';

  /** Fecha final del filtro, enlazada al input del formulario. */
  fechaFin = '';

  /** Texto para filtrar por cliente, mascota, veterinario, motivo o estado. */
  filtroTexto = '';
  /** Página que se está mostrando. */
  pagina = 1;
  /** Filas por página. */
  tamanoPagina = 5;
  /** Sentido del ordenamiento por fecha. */
  ascendente = false; ordenCampo = 'fecha';

  constructor(private citaService: CitaService, private router: Router) { }

  /**
   * Al iniciar, se proponen por defecto los ultimos 30 dias y los
   * proximos 30 dias como rango de fechas, y se consulta el backend.
   */
  ngOnInit(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    this.fechaInicio = this.aFormatoDatetimeLocal(hace30Dias);
    this.fechaFin = this.aFormatoDatetimeLocal(en30Dias);

    this.buscar();
  }

  /**
   * Consulta al backend las citas dentro del rango de fechas actualmente
   * seleccionado en el formulario.
   */
  buscar(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Debe seleccionar una fecha inicial y una fecha final';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.citaService.filtrarPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (datos) => {
        this.citas = datos;
        this.cargando = false;
      },
      error: (error) => {
        this.mensajeError = error?.error?.mensaje || error?.error?.message || 'No se pudo cargar la lista de citas. Verifique el rango de fechas y la conexión.';
        this.cargando = false;
        console.error(error);
      }
    });
  }

  /** Filtra y ordena localmente los resultados devueltos por el backend. */
  get citasFiltradas(): Cita[] {
    const q = this.filtroTexto.trim().toLowerCase();
    return this.citas.filter(c => [c.motivo, c.nombrePaciente, c.nombreCliente, c.nombreVeterinario, c.estado].some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => { const av: any = (a as any)[this.ordenCampo] ?? ''; const bv: any = (b as any)[this.ordenCampo] ?? ''; const cmp = this.ordenCampo === 'fecha' ? new Date(av).getTime() - new Date(bv).getTime() : String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' }); return cmp * (this.ascendente ? 1 : -1); });
  }

  /** Ordena por la columna seleccionada. */
  ordenar(campo: string): void { if (this.ordenCampo === campo) this.ascendente = !this.ascendente; else { this.ordenCampo = campo; this.ascendente = campo !== 'fecha'; } }

  /** Filas correspondientes a la página actual. */
  get citasPagina(): Cita[] {
    const inicio = (this.pagina - 1) * this.tamanoPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.tamanoPagina);
  }

  /** Total de páginas según el filtro actual. */
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.citasFiltradas.length / this.tamanoPagina));
  }

  /** Numeros de pagina para los botones de la paginacion. */
  get numerosPagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }

  /** Reinicia el listado al cambiar el texto de búsqueda. */
  cambiarFiltro(): void { this.pagina = 1; }

  /**
   * Guarda la cita elegida en el servicio y navega al formulario de
   * edicion, para que este pueda precargar los datos actuales (el
   * backend no ofrece un endpoint para consultar una sola cita por id).
   *
   * @param cita cita que el usuario quiere editar
   */
  editar(cita: Cita): void {
    this.citaService.seleccionarParaEditar(cita);
    this.router.navigate(['/citas/editar', cita.id]);
  }

  /**
   * Convierte un objeto Date de JavaScript al formato que espera el input
   * HTML de tipo "datetime-local" (yyyy-MM-ddTHH:mm).
   *
   * @param fecha fecha a convertir
   * @return texto en formato yyyy-MM-ddTHH:mm
   */
  private aFormatoDatetimeLocal(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${año}-${mes}-${dia}T${horas}:${minutos}`;
  }
}
