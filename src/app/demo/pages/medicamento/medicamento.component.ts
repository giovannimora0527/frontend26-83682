import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import {
  FichaInventario, ImportacionInventario, LoteInventario, MovimientoInventario,
  NuevoLote, NuevoMovimiento, ProductoInventario, ResumenImportacion
} from '../../../models/inventario';
import { AuthService } from '../../../services/auth.service';
import { InventarioService } from '../../../services/inventario.service';

import { PaginadorComponent } from '../../../utils/paginador.component';
/** Pantalla «medicamento» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-medicamento',
  imports: [PaginadorComponent, CommonModule, FormsModule],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent implements OnInit {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(InventarioService);
  /** Dependencia inyectada (AuthService). */
  private readonly auth = inject(AuthService);
  /** Indica si puede modificar. */
  readonly puedeModificar = this.auth.tienePermiso('INVENTARIO_GESTIONAR');
  /** Identificador de usuario. */
  readonly usuarioId = this.auth.obtenerUsuarioId();
  /** Columnas del resultado. */
  readonly columnas = 'codigo,nombre,descripcion,presentacion,tipo,invima,precioCompra,precioVenta,stockMinimo,fechaCompra,fechaIngreso,fechaProximoPedido,fechaVence,activo,numeroLote,cantidad';
  /** Página tamaño. */
  readonly paginaTamano = 10;

  /** Lista de fichas. */
  fichas: FichaInventario[] = [];
  /** Lotes del producto. */
  lotes: LoteInventario[] = [];
  /** Lista de movimientos. */
  movimientos: MovimientoInventario[] = [];
  /** Lista de historial. */
  historial: ResumenImportacion[] = [];
  /** Seleccionado. */
  seleccionado: FichaInventario | null = null;
  /** Producto. */
  producto: ProductoInventario | null = null;
  /** Indica si se está editando. */
  editando: number | null = null;
  /** Número de lote. */
  lote: NuevoLote | null = null;
  /** Movimiento. */
  movimiento: NuevoMovimiento | null = null;
  /** Lote movimiento. */
  loteMovimiento = 0;
  /** Indica si importación abierta. */
  importacionAbierta = false;
  /** Archivo. */
  archivo: File | null = null;
  /** Importación. */
  importacion: ImportacionInventario | null = null;
  /** Criterio de filtrado: búsqueda. */
  busqueda = '';
  /** Criterio de filtrado: filtro. */
  filtro = 'TODOS';
  /** Página actual (desde 0). */
  pagina = 1;
  /** Indica si ocupado. */
  ocupado = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() { this.cargar(); }

  /**
   * Filtradas.
   *
   * @returns filtradas.
   */
  get filtradas() {
    const q = this.busqueda.trim().toLowerCase();
    return this.fichas.filter(f => {
      const p = f.producto;
      const coincide = [p.nombre, p.codigo, p.presentacion, p.invima].some(valor => valor?.toLowerCase().includes(q));
      return coincide && (this.filtro === 'TODOS'
        || this.filtro === 'ACTIVO' && p.activo
        || this.filtro === 'INACTIVO' && !p.activo
        || this.filtro === 'AGOTADO' && f.disponible === 0
        || this.filtro === 'BAJO' && f.disponible < p.stockMinimo
        || this.filtro === 'VENCIDO' && f.vencido
        || this.filtro === 'PROXIMO' && f.proximoVencer);
    });
  }

  /**
   * Total páginas.
   *
   * @returns total páginas.
   */
  get totalPaginas() { return Math.max(1, Math.ceil(this.filtradas.length / this.paginaTamano)); }
  /**
   * Visibles.
   *
   * @returns visibles.
   */
  get visibles() { return this.filtradas.slice((this.pagina - 1) * this.paginaTamano, this.pagina * this.paginaTamano); }

  /** Carga los datos de la pantalla desde el backend. */
  cargar() {
    this.ejecutar(this.api.listar(), fichas => {
      this.fichas = fichas;
      this.pagina = Math.min(this.pagina, this.totalPaginas);
      if (this.seleccionado) {
        this.seleccionado = fichas.find(f => f.id === this.seleccionado?.id) ?? null;
      }
    });
  }

  /**
   * Abre producto.
   *
   * @param ficha ficha.
   */
  abrirProducto(ficha?: FichaInventario) {
    this.editando = ficha?.id ?? null;
    const hoy = this.hoy();
    this.producto = ficha ? { ...ficha.producto } : {
      codigo: '', nombre: '', descripcion: null, presentacion: null, tipo: 'MEDICAMENTO', invima: null,
      precioCompra: 0, precioVenta: 0, stockMinimo: 0, fechaCompra: hoy, fechaIngreso: hoy,
      fechaProximoPedido: null, fechaVence: null, activo: true
    };
  }

  /**
   * Guarda producto validando el formulario y enviándolo al backend.
   *
   * @param p p.
   */
  guardarProducto(p: ProductoInventario) {
    if (this.editando != null && !confirm('¿Guardar los cambios del producto?')) return;
    this.ejecutar(this.api.guardar(this.editando, { ...p, fechaVence: p.fechaVence || null,
      fechaProximoPedido: p.fechaProximoPedido || null }), () => {
      this.producto = null;
      this.aviso = 'Producto guardado.';
      this.cargar();
    });
  }

  /**
   * Abre detalle.
   *
   * @param ficha ficha.
   */
  abrirDetalle(ficha: FichaInventario) {
    this.seleccionado = ficha;
    this.lote = null;
    this.movimiento = null;
    this.lotes = [];
    this.movimientos = [];
    this.cargarDetalle(ficha.id);
  }

  /**
   * Carga detalle desde el backend.
   *
   * @param id identificador del registro.
   */
  private cargarDetalle(id: number) {
    this.ejecutar(forkJoin({
      lotes: this.api.lotes(id),
      movimientos: this.puedeModificar ? this.api.movimientos(id) : of([])
    }), datos => {
      this.lotes = datos.lotes;
      this.movimientos = datos.movimientos;
    });
  }

  /**
   * Prepara el formulario para un nuevo registro de lote.
   *
   * @param ficha ficha.
   */
  nuevoLote(ficha: FichaInventario) {
    this.lote = { numero: '', costo: ficha.producto.precioCompra, cantidad: 0,
      fechaIngreso: this.hoy(), fechaVence: null, referencia: null };
  }

  /**
   * Guarda lote validando el formulario y enviándolo al backend.
   *
   * @param ficha ficha.
   * @param lote lote.
   */
  guardarLote(ficha: FichaInventario, lote: NuevoLote) {
    if (!confirm('¿Registrar el lote y su entrada inicial?')) return;
    this.ejecutar(this.api.registrarLote(ficha.id, { ...lote, fechaVence: lote.fechaVence || null }), () => {
      this.lote = null;
      this.aviso = 'Lote registrado.';
      this.cargar();
      this.cargarDetalle(ficha.id);
    });
  }

  /**
   * Prepara el formulario para un nuevo registro de movimiento.
   *
   * @param lote lote.
   */
  nuevoMovimiento(lote: LoteInventario) {
    this.loteMovimiento = lote.id;
    this.movimiento = { tipo: 'ENTRADA', cantidad: 1, motivo: '', referencia: null };
  }

  /**
   * Guarda movimiento validando el formulario y enviándolo al backend.
   *
   * @param ficha ficha.
   * @param movimiento movimiento.
   */
  guardarMovimiento(ficha: FichaInventario, movimiento: NuevoMovimiento) {
    if (!confirm('¿Confirmar el movimiento? Quedará registrado en el historial.')) return;
    this.ejecutar(this.api.registrarMovimiento(ficha.id, this.loteMovimiento, movimiento), () => {
      this.movimiento = null;
      this.aviso = 'Movimiento registrado.';
      this.cargar();
      this.cargarDetalle(ficha.id);
    });
  }

  /** Abre importación. */
  abrirImportacion() {
    this.importacionAbierta = true;
    this.actualizarHistorial();
  }

  /**
   * Selecciona archivo.
   *
   * @param evento evento.
   */
  seleccionarArchivo(evento: Event) {
    this.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.importacion = null;
  }

  /** Previsualiza los datos de la pantalla antes de confirmarlo. */
  previsualizar() {
    if (!this.archivo) return;
    this.ejecutar(this.api.previsualizar(this.archivo), datos => {
      this.importacion = datos;
      this.actualizarHistorial();
    });
  }

  /**
   * Confirma los datos de la pantalla.
   *
   * @param id identificador del registro.
   */
  confirmar(id: number) {
    if (!confirm('¿Importar los registros válidos?')) return;
    this.ejecutar(this.api.confirmar(id), resultado => {
      this.importacion = resultado;
      this.aviso = 'Importación confirmada.';
      this.actualizarHistorial();
      this.cargar();
    });
  }

  /**
   * Consulta el detalle de importación.
   *
   * @param id identificador del registro.
   */
  detalleImportacion(id: number) {
    this.ejecutar(this.api.detalle(id), datos => { this.importacion = datos; });
  }

  /** Descarga plantilla como archivo. */
  descargarPlantilla() {
    const hoy = this.hoy();
    const ejemplo = ['VT000001', 'Utensilio de ejemplo', '', '', 'UTENSILIO', '', '0', '0', '0', hoy, hoy, '', '', 'true', '', '0'].join(',');
    this.descargarCsv('plantilla-inventario.csv', this.columnas + '\n' + ejemplo + '\n');
  }

  /**
   * Descarga errores como archivo.
   *
   * @param carga carga.
   */
  descargarErrores(carga: ImportacionInventario) {
    const proteger = (valor: string) => {
      const texto = /^[=+@-]/.test(valor.trimStart()) ? "'" + valor : valor;
      return '"' + texto.replaceAll('"', '""') + '"';
    };
    const filas = carga.filas.filter(fila => fila.errores.length > 0)
      .map(fila => [String(fila.numero), fila.producto?.codigo ?? '', fila.errores.join(' · ')]
        .map(proteger).join(','));
    this.descargarCsv('errores-importacion-' + carga.resumen.id + '.csv',
      ['fila,codigo,error', ...filas].join('\n'));
  }

  /**
   * Descarga CSV como archivo.
   *
   * @param nombre nombre del archivo o registro.
   * @param contenido contenido.
   */
  private descargarCsv(nombre: string, contenido: string) {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /** Actualiza historial. */
  private actualizarHistorial() {
    this.ejecutar(this.api.historial(), historial => { this.historial = historial; });
  }

  /** Solicitudes. */
  private solicitudes = 0;

  /**
   * Ejecuta los datos de la pantalla.
   *
   * @param operacion operación.
   * @param exito exito.
   */
  private ejecutar<T>(operacion: Observable<T>, exito: (valor: T) => void) {
    this.solicitudes++;
    this.ocupado = true;
    this.error = '';
    operacion.pipe(finalize(() => { this.ocupado = --this.solicitudes > 0; })).subscribe({
      next: exito,
      error: respuesta => {
        this.error = respuesta.error?.mensaje ?? 'No se pudo completar la operación.';
      }
    });
  }

  /** Hoy. */
  private hoy() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date());
  }
}
