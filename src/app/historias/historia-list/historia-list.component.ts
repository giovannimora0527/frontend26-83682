import { Component, OnInit } from '@angular/core';
import { HistoriaMedica } from '../historia-medica.model';
import { HistoriaMedicaService } from '../historia-medica.service';

/**
 * Componente que muestra la lista de historias medicas, con un filtro
 * opcional por rango de fechas (Requerimiento 5 del backend).
 */
@Component({
  selector: 'app-historia-list',
  templateUrl: './historia-list.component.html',
  styleUrls: ['./historia-list.component.css']
})
export class HistoriaListComponent implements OnInit {

  /** Lista de historias medicas traida desde el backend. */
  historias: HistoriaMedica[] = [];

  /** Mensaje de error a mostrar si alguna peticion al backend falla. */
  mensajeError = '';

  /** Mensaje de confirmacion a mostrar despues de eliminar una historia. */
  mensajeExito = '';

  /** Indica si la peticion al backend todavia esta en curso. */
  cargando = true;

  filtroTexto = ''; pagina = 1; tamanoPagina = 5; ordenAscendente = false; ordenCampo = 'fechaCreacion'; historiaDetalle: HistoriaMedica | null = null;

  /** Fecha inicial del filtro (opcional). */
  fechaInicio = '';

  /** Fecha final del filtro (opcional). */
  fechaFin = '';

  constructor(private historiaMedicaService: HistoriaMedicaService) { }

  ngOnInit(): void {
    this.buscar();
  }

  /**
   * Consulta la lista de historias medicas. Si el usuario lleno las dos
   * fechas del filtro, se filtra por ese rango; si no, trae todas.
   */
  buscar(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.historiaMedicaService.listar(this.fechaInicio || undefined, this.fechaFin || undefined).subscribe({
      next: (datos) => {
        this.historias = datos;
        this.pagina = 1;
        this.cargando = false;
      },
      error: (error) => {
        this.mensajeError = error?.error?.mensaje || error?.error?.message || 'No se pudo cargar la lista de historias clínicas. Verifique la conexión e intente nuevamente.';
        this.cargando = false;
        console.error(error);
      }
    });
  }

  /**
   * Limpia el filtro de fechas y vuelve a consultar todas las historias.
   */
  limpiarFiltro(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.buscar();
  }

  /** Aplica búsqueda general y orden por fecha a las historias cargadas. */
  get historiasFiltradas(): HistoriaMedica[] {
    const q = this.filtroTexto.trim().toLowerCase();
    return this.historias.filter(h => [h.nombrePaciente, h.nombreCliente, h.nombreVeterinario, h.motivoConsulta, h.diagnostico, h.observaciones]
      .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => { const av: any = (a as any)[this.ordenCampo] ?? ''; const bv: any = (b as any)[this.ordenCampo] ?? ''; const cmp = this.ordenCampo === 'fechaCreacion' ? new Date(av || '1970-01-01T00:00:00').getTime() - new Date(bv || '1970-01-01T00:00:00').getTime() : String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' }); return cmp * (this.ordenAscendente ? 1 : -1); });
  }
  ordenar(campo: string): void { if (this.ordenCampo === campo) this.ordenAscendente = !this.ordenAscendente; else { this.ordenCampo = campo; this.ordenAscendente = campo !== 'fechaCreacion'; } }
  get historiasPagina(): HistoriaMedica[] { const inicio = (this.pagina - 1) * this.tamanoPagina; return this.historiasFiltradas.slice(inicio, inicio + this.tamanoPagina); }
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.historiasFiltradas.length / this.tamanoPagina)); }
  verDetalle(historia: HistoriaMedica): void { this.historiaDetalle = historia; }

  /**
   * Elimina una historia medica, pidiendo confirmacion antes.
   *
   * @param historia historia medica a eliminar
   */
  eliminar(historia: HistoriaMedica): void {
    const confirmado = confirm(`¿Seguro que desea eliminar la historia médica #${historia.id}?`);
    if (!confirmado) {
      return;
    }

    this.historiaMedicaService.eliminar(historia.id as number).subscribe({
      next: () => {
        this.mensajeExito = 'Historia médica eliminada correctamente.';
        this.buscar();
      },
      error: (error) => {
        this.mensajeError = error?.error?.mensaje || error?.error?.message || 'No se pudo eliminar la historia médica. Los registros clínicos relacionados se conservan por integridad.';
        console.error(error);
      }
    });
  }
}
