import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnotacionHistoria } from '../anotacion-historia.model';
import { AnotacionHistoriaService } from '../anotacion-historia.service';

/**
 * Componente que muestra las anotaciones de una historia medica
 * especifica. El id de la historia medica se recibe por "query param"
 * (?historiaId=...), normalmente llegando desde el enlace "Anotaciones"
 * de la lista de Historias Medicas; tambien se puede escribir a mano.
 */
@Component({
  selector: 'app-anotacion-list',
  templateUrl: './anotacion-list.component.html',
  styleUrls: ['./anotacion-list.component.css']
})
export class AnotacionListComponent implements OnInit {

  /** Id de la historia medica cuyas anotaciones se quieren ver. */
  historiaMedicaId: number | null = null;

  /** Lista de anotaciones traida desde el backend. */
  anotaciones: AnotacionHistoria[] = [];

  /** Mensaje de error a mostrar si la peticion al backend falla. */
  mensajeError = '';
  filtroTexto = ''; pagina = 1; tamanoPagina = 5; anotacionDetalle: AnotacionHistoria | null = null; ordenAscendente = false;

  /** Indica si la peticion al backend todavia esta en curso. */
  cargando = false;

  constructor(
    private anotacionHistoriaService: AnotacionHistoriaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  /**
   * Lee el query param "historiaId" de la URL; si viene, consulta de una
   * vez las anotaciones de esa historia medica.
   */
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(parametros => {
      const idTexto = parametros.get('historiaId');
      this.historiaMedicaId = idTexto ? Number(idTexto) : null;

      if (this.historiaMedicaId) {
        this.buscar();
      }
    });
  }

  /**
   * Actualiza la URL con el id ingresado manualmente y consulta sus
   * anotaciones.
   */
  buscarPorIdIngresado(): void {
    if (!this.historiaMedicaId) {
      this.mensajeError = 'Ingrese el id de una historia médica';
      return;
    }
    this.router.navigate(['/anotaciones'], { queryParams: { historiaId: this.historiaMedicaId } });
  }

  /**
   * Guarda la anotacion elegida en el servicio y navega al formulario de
   * edicion, para que este pueda precargar los datos actuales (el
   * backend no ofrece un endpoint para consultar una sola anotacion).
   *
   * @param anotacion anotacion que el usuario quiere editar
   */
  editar(anotacion: AnotacionHistoria): void {
    this.anotacionHistoriaService.seleccionarParaEditar(anotacion);
    this.router.navigate(['/anotaciones/editar', anotacion.id]);
  }

  /** Filtra, ordena y pagina las anotaciones mostradas en la tabla. */
  get anotacionesFiltradas(): AnotacionHistoria[] {
    const q = this.filtroTexto.trim().toLowerCase();
    return this.anotaciones.filter(a => [a.descripcion, a.observacion, a.diagnosticoEvolucion, a.nombreVeterinario]
      .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => (new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime()) * (this.ordenAscendente ? 1 : -1));
  }
  get anotacionesPagina(): AnotacionHistoria[] { const inicio = (this.pagina - 1) * this.tamanoPagina; return this.anotacionesFiltradas.slice(inicio, inicio + this.tamanoPagina); }
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.anotacionesFiltradas.length / this.tamanoPagina)); }
  verDetalle(anotacion: AnotacionHistoria): void { this.anotacionDetalle = anotacion; }

  /**
   * Consulta al backend las anotaciones de la historia medica actual.
   */
  buscar(): void {
    if (!this.historiaMedicaId) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.anotacionHistoriaService.listarPorHistoria(this.historiaMedicaId).subscribe({
      next: (datos) => {
        this.anotaciones = datos;
        this.pagina = 1;
        this.cargando = false;
      },
      error: (error) => {
        this.mensajeError = error?.error?.mensaje || error?.error?.message || 'No se pudieron cargar las anotaciones. Verifique la historia médica e intente nuevamente.';
        this.cargando = false;
        console.error(error);
      }
    });
  }
}
