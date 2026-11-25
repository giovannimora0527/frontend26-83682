import { hoyBogota } from '../../../services/agenda.service';
import { AuthService } from 'src/app/services/auth.service';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import {
  DespachoService, DetalleDespacho, EntregaDespacho, FormulaDespacho, MedicamentoDespacho,
  SeleccionLote, estadosDespacho
} from '../../../services/despacho.service';

/** Pantalla «despacho» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent implements OnInit {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(DespachoService);
  /** Permiso DESPACHO_OPERAR: preparar, confirmar, cancelar y revertir (los demás perfiles autorizados solo consultan). */
  readonly puedeOperar = inject(AuthService).tienePermiso('DESPACHO_OPERAR');
  /** Estados. */
  readonly estados = estadosDespacho;
  /** Tab. */
  tab: 'formulas' | 'historial' = 'formulas';
  /** Criterio de filtrado: filtros. */
  filtros = { id: '', propietario: '', mascota: '', fecha: '', estado: '' };
  /** Fechas. */
  fechas = { desde: '', hasta: '' };
  /** Formulario reactivo: fórmulas. */
  formulas: FormulaDespacho[] = [];
  /** Lista de entregas. */
  entregas: EntregaDespacho[] = [];
  /** Detalle. */
  detalle: DetalleDespacho | null = null;
  /** Página actual (desde 0). */
  pagina = 0;
  /** Indica si ocupado. */
  ocupado = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';
  /** Cantidades. */
  cantidades: Record<number, number | null> = {};
  /** Número de intento. */
  private intento: { clave: string; firma: string } | null = null;

  /**
   * Próximo a vencer.
   *
   * @param fechaVence fecha vence.
   */
  proximoAVencer(fechaVence: string | null) {
    if (!fechaVence) return false;
    const hoy = hoyBogota();
    const limite = new Date(hoy + 'T00:00:00Z');
    limite.setUTCDate(limite.getUTCDate() + 30);
    return fechaVence >= hoy && fechaVence <= limite.toISOString().slice(0, 10);
  }

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() { void this.buscar(); }

  /**
   * Busca los datos de la pantalla según los filtros.
   *
   * @param pagina número de página.
   */
  buscar(pagina = 0) {
    void this.operar(async () => {
      this.pagina = pagina;
      if (this.tab === 'formulas') await this.cargarFormulas();
      else await this.cargarHistorial();
    });
  }

  /**
   * Cambia vista.
   *
   * @param tab tab.
   */
  cambiarVista(tab: 'formulas' | 'historial') {
    this.tab = tab;
    this.detalle = null;
    return this.buscar();
  }

  /**
   * Abre los datos de la pantalla.
   *
   * @param id identificador del registro.
   */
  abrir(id: number) {
    return this.operar(() => this.cargarDetalle(id));
  }

  /**
   * Sugiere los datos de la pantalla.
   *
   * @param m m.
   * @param cantidad cantidad.
   */
  sugerir(m: MedicamentoDespacho, cantidad: number | null) {
    let pendiente = Math.max(0, Math.min(Math.trunc(cantidad ?? 0), m.prescripcion.pendiente));
    for (const lote of m.lotes) {
      const unidades = Math.min(pendiente, lote.cantidad);
      this.cantidades[lote.id] = unidades;
      pendiente -= unidades;
    }
  }

  /**
   * Cantidad seleccionada.
   *
   * @param m m.
   */
  cantidadSeleccionada(m: MedicamentoDespacho) {
    return m.lotes.reduce((total, lote) => total + (this.cantidades[lote.id] ?? 0), 0);
  }

  /** Indica si la fórmula se puede preparar para despacho. */
  puedePreparar() {
    if (!this.detalle || ['DESPACHADO', 'CANCELADO'].includes(this.detalle.formula.estado)) return false;
    return this.detalle.medicamentos.some(m => this.cantidadSeleccionada(m) > 0) &&
      this.detalle.medicamentos.every(m => this.cantidadSeleccionada(m) <= m.prescripcion.pendiente &&
        m.lotes.every(l => {
          const n = this.cantidades[l.id] ?? 0;
          return Number.isInteger(n) && n >= 0 && n <= l.cantidad;
        }));
  }

  /**
   * Prepara los datos de la pantalla.
   *
   * @param d d.
   */
  preparar(d: DetalleDespacho) {
    if (!this.puedePreparar()) return;
    const lotes: SeleccionLote[] = d.medicamentos.flatMap(m => m.lotes
      .filter(l => (this.cantidades[l.id] ?? 0) > 0)
      .map(l => ({ medicamento: m.prescripcion.medicamento, lote: l.id, cantidad: this.cantidades[l.id]! })));
    const firma = JSON.stringify([d.formula.id, lotes]);
    if (this.intento?.firma !== firma) this.intento = { firma, clave: crypto.randomUUID() };
    const clave = this.intento.clave;
    void this.operar(async () => {
      await firstValueFrom(this.api.preparar(d.formula.id, clave, lotes));
      this.intento = null;
      this.aviso = 'Preparación registrada. Las existencias se conservan hasta confirmar la entrega.';
      await this.cargarDetalle(d.formula.id);
      await this.cargarFormulas();
    });
  }

  /**
   * Nombre lote.
   *
   * @param d d.
   * @param l l.
   */
  nombreLote(d: DetalleDespacho, l: SeleccionLote) {
    const medicamento = d.medicamentos.find(m => m.prescripcion.medicamento === l.medicamento);
    const lote = medicamento?.lotes.find(x => x.id === l.lote);
    return (medicamento?.prescripcion.nombre ?? l.medicamento) + ' · lote ' + (lote?.numero ?? l.lote);
  }

  /**
   * Confirma los datos de la pantalla.
   *
   * @param d d.
   */
  confirmar(d: DetalleDespacho) {
    const plan = d.preparacion;
    if (!plan || !confirm('¿Confirmar la entrega efectiva y descontar las unidades del resumen?')) return;
    void this.operar(async () => {
      const entrega = await firstValueFrom(this.api.confirmar(plan.id));
      this.aviso = 'Entrega ' + entrega.id + ' confirmada.';
      await this.cargarDetalle(d.formula.id);
      await this.cargarFormulas();
    });
  }

  /**
   * Cambia los datos de la pantalla.
   *
   * @param d d.
   * @param accion acción.
   * @param motivo motivo indicado por el usuario.
   */
  cambiar(d: DetalleDespacho, accion: 'cancelar' | 'disponibilidad', motivo: string) {
    if (!motivo.trim() || (accion === 'cancelar' && !confirm('¿Cancelar este despacho?'))) return;
    void this.operar(async () => {
      this.detalle = await firstValueFrom(this.api.cambiar(d.formula.id, accion, motivo));
      this.cantidades = {};
      await this.cargarFormulas();
    });
  }

  /**
   * Revierte los datos de la pantalla.
   *
   * @param e evento del navegador.
   * @param motivo motivo indicado por el usuario.
   */
  revertir(e: EntregaDespacho, motivo: string) {
    if (!motivo.trim() || !confirm('¿Registrar la devolución de esta entrega a los lotes originales?')) return;
    void this.operar(async () => {
      await firstValueFrom(this.api.revertir(e.id, motivo));
      this.aviso = 'Reversión registrada.';
      if (this.detalle) await this.cargarDetalle(this.detalle.formula.id);
      if (this.tab === 'historial') await this.cargarHistorial();
      else await this.cargarFormulas();
    });
  }

  /**
   * Descarga los datos de la pantalla como archivo.
   *
   * @param e evento del navegador.
   */
  descargar(e: EntregaDespacho) {
    return this.operar(async () => descargarClinica(await firstValueFrom(this.api.pdf(e.id)), 'despacho-' + e.id + '.pdf'));
  }

  /**
   * Etiqueta.
   *
   * @param estado estado a aplicar.
   */
  etiqueta(estado: string) {
    return estado.toLowerCase().replaceAll('_', ' ');
  }

  /** Carga fórmulas desde el backend. */
  private cargarFormulas() {
    return firstValueFrom(this.api.formulas(this.params(this.filtros))).then(items => { this.formulas = items; });
  }

  /** Carga historial desde el backend. */
  private cargarHistorial() {
    return firstValueFrom(this.api.historial(this.params(this.fechas))).then(items => { this.entregas = items; });
  }

  /**
   * Carga detalle desde el backend.
   *
   * @param id identificador del registro.
   */
  private async cargarDetalle(id: number) {
    this.detalle = await firstValueFrom(this.api.detalle(id));
    this.cantidades = {};
  }

  /**
   * Params.
   *
   * @param filtros filtros aplicados.
   * @returns resultado de params.
   */
  private params(filtros: Record<string, string>): Record<string, string | number> {
    return { ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor.trim())), pagina: this.pagina };
  }

  /**
   * Ejecuta la operación los datos de la pantalla.
   *
   * @param accion acción.
   */
  private async operar(accion: () => Promise<void>) {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';
    this.aviso = '';
    try {
      await accion();
    } catch (e) {
      const fallo = e as { error?: unknown; status?: number };
      this.error = await mensajeClinica(fallo);
      if (fallo.status === 409) this.error += ' Usa Actualizar detalle para consultar el estado actual.';
    } finally {
      this.ocupado = false;
    }
  }
}
