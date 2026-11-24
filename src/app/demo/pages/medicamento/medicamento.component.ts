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

@Component({
  selector: 'app-medicamento',
  imports: [CommonModule, FormsModule],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent implements OnInit {
  private readonly api = inject(InventarioService);
  private readonly auth = inject(AuthService);
  readonly puedeModificar = ['ADMIN', 'ADMINISTRADOR'].includes((this.auth.obtenerPerfil() ?? '').trim().toUpperCase());
  readonly usuarioId = this.auth.obtenerUsuarioId();
  readonly columnas = 'codigo,nombre,descripcion,presentacion,tipo,invima,precioCompra,precioVenta,stockMinimo,fechaCompra,fechaIngreso,fechaProximoPedido,fechaVence,activo,numeroLote,cantidad';
  readonly paginaTamano = 10;

  fichas: FichaInventario[] = [];
  lotes: LoteInventario[] = [];
  movimientos: MovimientoInventario[] = [];
  historial: ResumenImportacion[] = [];
  seleccionado: FichaInventario | null = null;
  producto: ProductoInventario | null = null;
  editando: number | null = null;
  lote: NuevoLote | null = null;
  movimiento: NuevoMovimiento | null = null;
  loteMovimiento = 0;
  importacionAbierta = false;
  archivo: File | null = null;
  importacion: ImportacionInventario | null = null;
  busqueda = '';
  filtro = 'TODOS';
  pagina = 1;
  ocupado = false;
  error = '';
  aviso = '';

  ngOnInit() { this.cargar(); }

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

  get totalPaginas() { return Math.max(1, Math.ceil(this.filtradas.length / this.paginaTamano)); }
  get visibles() { return this.filtradas.slice((this.pagina - 1) * this.paginaTamano, this.pagina * this.paginaTamano); }

  cargar() {
    this.ejecutar(this.api.listar(), fichas => {
      this.fichas = fichas;
      this.pagina = Math.min(this.pagina, this.totalPaginas);
      if (this.seleccionado) {
        this.seleccionado = fichas.find(f => f.id === this.seleccionado?.id) ?? null;
      }
    });
  }

  abrirProducto(ficha?: FichaInventario) {
    this.editando = ficha?.id ?? null;
    const hoy = this.hoy();
    this.producto = ficha ? { ...ficha.producto } : {
      codigo: '', nombre: '', descripcion: null, presentacion: null, tipo: 'MEDICAMENTO', invima: null,
      precioCompra: 0, precioVenta: 0, stockMinimo: 0, fechaCompra: hoy, fechaIngreso: hoy,
      fechaProximoPedido: null, fechaVence: null, activo: true
    };
  }

  guardarProducto(p: ProductoInventario) {
    if (this.editando != null && !confirm('¿Guardar los cambios del producto?')) return;
    this.ejecutar(this.api.guardar(this.editando, { ...p, fechaVence: p.fechaVence || null,
      fechaProximoPedido: p.fechaProximoPedido || null }), () => {
      this.producto = null;
      this.aviso = 'Producto guardado.';
      this.cargar();
    });
  }

  abrirDetalle(ficha: FichaInventario) {
    this.seleccionado = ficha;
    this.lote = null;
    this.movimiento = null;
    this.lotes = [];
    this.movimientos = [];
    this.cargarDetalle(ficha.id);
  }

  private cargarDetalle(id: number) {
    this.ejecutar(forkJoin({
      lotes: this.api.lotes(id),
      movimientos: this.puedeModificar ? this.api.movimientos(id) : of([])
    }), datos => {
      this.lotes = datos.lotes;
      this.movimientos = datos.movimientos;
    });
  }

  nuevoLote(ficha: FichaInventario) {
    this.lote = { numero: '', costo: ficha.producto.precioCompra, cantidad: 0,
      fechaIngreso: this.hoy(), fechaVence: null, referencia: null };
  }

  guardarLote(ficha: FichaInventario, lote: NuevoLote) {
    if (!confirm('¿Registrar el lote y su entrada inicial?')) return;
    this.ejecutar(this.api.registrarLote(ficha.id, { ...lote, fechaVence: lote.fechaVence || null }), () => {
      this.lote = null;
      this.aviso = 'Lote registrado.';
      this.cargar();
      this.cargarDetalle(ficha.id);
    });
  }

  nuevoMovimiento(lote: LoteInventario) {
    this.loteMovimiento = lote.id;
    this.movimiento = { tipo: 'ENTRADA', cantidad: 1, motivo: '', referencia: null };
  }

  guardarMovimiento(ficha: FichaInventario, movimiento: NuevoMovimiento) {
    if (!confirm('¿Confirmar el movimiento? Quedará registrado en el historial.')) return;
    this.ejecutar(this.api.registrarMovimiento(ficha.id, this.loteMovimiento, movimiento), () => {
      this.movimiento = null;
      this.aviso = 'Movimiento registrado.';
      this.cargar();
      this.cargarDetalle(ficha.id);
    });
  }

  abrirImportacion() {
    this.importacionAbierta = true;
    this.actualizarHistorial();
  }

  seleccionarArchivo(evento: Event) {
    this.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.importacion = null;
  }

  previsualizar() {
    if (!this.archivo) return;
    this.ejecutar(this.api.previsualizar(this.archivo), datos => {
      this.importacion = datos;
      this.actualizarHistorial();
    });
  }

  confirmar(id: number) {
    if (!confirm('¿Importar los registros válidos?')) return;
    this.ejecutar(this.api.confirmar(id), resultado => {
      this.importacion = resultado;
      this.aviso = 'Importación confirmada.';
      this.actualizarHistorial();
      this.cargar();
    });
  }

  detalleImportacion(id: number) {
    this.ejecutar(this.api.detalle(id), datos => { this.importacion = datos; });
  }

  descargarPlantilla() {
    const hoy = this.hoy();
    const ejemplo = ['VT000001', 'Utensilio de ejemplo', '', '', 'UTENSILIO', '', '0', '0', '0', hoy, hoy, '', '', 'true', '', '0'].join(',');
    this.descargarCsv('plantilla-inventario.csv', this.columnas + '\n' + ejemplo + '\n');
  }

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

  private descargarCsv(nombre: string, contenido: string) {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private actualizarHistorial() {
    this.ejecutar(this.api.historial(), historial => { this.historial = historial; });
  }

  private solicitudes = 0;

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

  private hoy() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date());
  }
}
