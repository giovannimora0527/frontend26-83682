import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map, Observable, Subscription } from 'rxjs';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { InventarioService } from '../inventario/service/inventario.service';
import { MedicoService } from '../medico/service/medico.service';
import { ColumnaReporte, FiltroReporte, Reporte, ReporteCatalogo, ValorReporte } from 'src/app/models/reporte';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { rangoAtajo, RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Columnas, Tabla } from 'src/app/shared/utils/tabla.util';
import { ReporteService } from './service/reporte.service';
import { ValorReportePipe } from './valor-reporte.pipe';

interface Fila {
  indice: number;
  valores: Record<string, ValorReporte>;
}

interface Opcion {
  valor: string;
  etiqueta: string;
}

const TITULOS: Record<string, string> = {
  agrupacion: 'Agrupar por', estado: 'Estado', medicoId: 'Médico', especializacionId: 'Especialización', medicamentoId: 'Producto', tipo: 'Tipo de movimiento',
  dias: 'Días para vencer'
};
const OPCIONES: Record<string, string> = { DIA: 'Día', MES: 'Mes', ANIO: 'Año', EN_ATENCION: 'En atención', ENTRADA_CARGA_MASIVA: 'Entrada por carga masiva', ENTRADA_REVERSION: 'Entrada por reversión' };

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, BotonDescargaComponent, BotonOrdenComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe, ValorReportePipe],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly reporteService = inject(ReporteService);
  private readonly medicoService = inject(MedicoService);
  private readonly especializacionService = inject(EspecializacionService);
  private readonly inventarioService = inject(InventarioService);
  private consulta?: Subscription;

  grupos: { nombre: string; reportes: ReporteCatalogo[] }[] = [];
  cargando = false;
  error = '';

  elegido: ReporteCatalogo | null = null;
  rango: RangoFechas | null = null;
  inicial: RangoFechas | null = null;
  valores: Record<string, string> = {};
  listas: Record<string, Opcion[]> = {};
  errorListas = '';
  intentado = false;

  consultando = false;
  errorReporte = '';
  reporte: Reporte | null = null;
  /** Filtros de la vista previa; los archivos se exportan con estos mismos. */
  aplicados: Record<string, string> = {};
  tabla = new Tabla<Fila>({ indice: (fila) => fila.indice }, 'indice');

  constructor() {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.error = '';
    this.reporteService.catalogo().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (catalogo) => {
        this.grupos = [...new Set(catalogo.map(({ grupo }) => grupo))]
          .map((nombre) => ({ nombre, reportes: catalogo.filter(({ grupo }) => grupo === nombre) }));
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar los reportes.');
        this.cargando = false;
      }
    });
  }

  elegir(reporte: ReporteCatalogo): void {
    this.elegido = reporte;
    this.inicial = this.fechasObligatorias ? rangoAtajo('mes') : { desde: '', hasta: '' };
    this.rango = this.inicial;
    this.valores = {};
    this.intentado = false;
    for (const { clave, opciones } of this.otrosFiltros) {
      this.valores[clave] = ['MES', 'TODAS'].find((opcion) => opciones?.includes(opcion)) ?? '';
    }
    this.limpiar();
    this.cargarListas();
  }

  get usaFechas(): boolean {
    return !!this.elegido?.filtros.some(({ clave }) => clave === 'desde' || clave === 'hasta');
  }

  get fechasObligatorias(): boolean {
    return !!this.elegido?.filtros.some(({ clave, obligatorio }) => obligatorio && (clave === 'desde' || clave === 'hasta'));
  }

  get otrosFiltros(): FiltroReporte[] {
    return this.elegido?.filtros.filter(({ clave }) => clave !== 'desde' && clave !== 'hasta') ?? [];
  }

  cargarListas(): void {
    this.errorListas = '';
    for (const { clave } of this.otrosFiltros) {
      const lista = this.listas[clave] ? null : this.lista(clave);
      lista?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (opciones) => this.listas[clave] = opciones,
        error: (error) => this.errorListas = mensajeError(error, 'No fue posible cargar las opciones de los filtros.')
      });
    }
  }

  titulo(clave: string): string {
    return TITULOS[clave] ?? clave;
  }

  /** null cuando el filtro no es una lista. */
  opciones({ clave, opciones }: FiltroReporte): Opcion[] | null {
    if (opciones) {
      return opciones.map((valor) => ({ valor, etiqueta: OPCIONES[valor] ?? valor.charAt(0) + valor.slice(1).toLowerCase().replace(/_/g, ' ') }));
    }
    return clave.endsWith('Id') ? this.listas[clave] ?? [] : null;
  }

  tieneVacia({ opciones }: FiltroReporte): boolean {
    return !opciones?.some((opcion) => opcion === 'MES' || opcion === 'TODAS');
  }

  invalido({ clave, obligatorio }: FiltroReporte): boolean {
    const valor = String(this.valores[clave] ?? '').trim();
    return (obligatorio && !valor) || (clave === 'dias' && !!valor && !/^[1-9]\d{0,3}$/.test(valor));
  }

  cambiarFechas(rango: RangoFechas | null): void {
    this.rango = rango;
    this.limpiar();
  }

  /** La vista previa deja de valer si cambia un filtro. */
  limpiar(): void {
    this.consulta?.unsubscribe();
    this.consultando = false;
    this.reporte = null;
    this.errorReporte = '';
  }

  consultar(): void {
    if (!this.elegido || this.consultando) {
      return;
    }
    this.intentado = true;
    this.limpiar();
    if ((this.usaFechas && !this.rango) || this.otrosFiltros.some((filtro) => this.invalido(filtro))) {
      this.errorReporte = 'Revisa los filtros del reporte.';
      return;
    }
    const filtros = { ...(this.usaFechas && this.rango ? { desde: this.rango.desde, hasta: this.rango.hasta } : {}), ...this.valores };
    this.consultando = true;
    this.consulta = this.reporteService.consultar(this.elegido.codigo, filtros).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reporte) => {
        const columnas: Columnas<Fila> = { indice: (fila) => fila.indice };
        for (const { clave } of reporte.columnas) {
          columnas[`c.${clave}`] = (fila) => fila.valores[clave];
        }
        // Se respeta el orden del backend hasta que el usuario ordene una columna.
        this.tabla = new Tabla<Fila>(columnas, 'indice');
        this.tabla.items = reporte.filas.map((valores, indice) => ({ indice, valores }));
        this.reporte = reporte;
        this.aplicados = filtros;
        this.consultando = false;
      },
      error: (error) => {
        this.errorReporte = mensajeError(error, 'No fue posible generar el reporte.');
        this.consultando = false;
      }
    });
  }

  esNumerica({ tipo }: ColumnaReporte): boolean {
    return tipo === 'moneda' || tipo === 'numero' || tipo === 'porcentaje';
  }

  get hayTotales(): boolean {
    return Object.keys(this.reporte?.totales ?? {}).length > 0;
  }

  private lista(clave: string): Observable<Opcion[]> | null {
    switch (clave) {
      case 'medicoId':
        return this.medicoService.listar().pipe(map((medicos) => medicos.map((m) => ({ valor: String(m.id), etiqueta: `${m.nombres} ${m.apellidos}` }))));
      case 'especializacionId':
        return this.especializacionService.listar().pipe(map((lista) => lista.map((e) => ({ valor: String(e.id), etiqueta: e.nombre ?? '' }))));
      case 'medicamentoId':
        return this.inventarioService.listarProductos().pipe(map((productos) => productos.map((p) => ({ valor: String(p.id), etiqueta: `${p.codigo} - ${p.nombre}` }))));
      default:
        return null;
    }
  }
}
