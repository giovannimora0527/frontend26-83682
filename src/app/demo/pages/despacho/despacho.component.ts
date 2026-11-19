import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import {
  DespachoService, DetalleDespacho, EntregaDespacho, FormulaDespacho, MedicamentoDespacho,
  SeleccionLote, estadosDespacho
} from '../../../services/despacho.service';

@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent implements OnInit {
  private readonly api = inject(DespachoService);
  readonly estados = estadosDespacho;
  tab: 'formulas' | 'historial' = 'formulas';
  filtros = { id: '', propietario: '', mascota: '', fecha: '', estado: '' };
  fechas = { desde: '', hasta: '' };
  formulas: FormulaDespacho[] = [];
  entregas: EntregaDespacho[] = [];
  detalle: DetalleDespacho | null = null;
  pagina = 0;
  ocupado = false;
  error = '';
  aviso = '';
  cantidades: Record<number, number | null> = {};
  private intento: { clave: string; firma: string } | null = null;

  ngOnInit() { void this.buscar(); }

  buscar(pagina = 0) {
    void this.operar(async () => {
      this.pagina = pagina;
      if (this.tab === 'formulas') await this.cargarFormulas();
      else await this.cargarHistorial();
    });
  }

  cambiarVista(tab: 'formulas' | 'historial') {
    this.tab = tab;
    this.detalle = null;
    return this.buscar();
  }

  abrir(id: number) {
    return this.operar(() => this.cargarDetalle(id));
  }

  sugerir(m: MedicamentoDespacho, cantidad: number | null) {
    let pendiente = Math.max(0, Math.min(Math.trunc(cantidad ?? 0), m.prescripcion.pendiente));
    for (const lote of m.lotes) {
      const unidades = Math.min(pendiente, lote.cantidad);
      this.cantidades[lote.id] = unidades;
      pendiente -= unidades;
    }
  }

  cantidadSeleccionada(m: MedicamentoDespacho) {
    return m.lotes.reduce((total, lote) => total + (this.cantidades[lote.id] ?? 0), 0);
  }

  puedePreparar() {
    if (!this.detalle || ['DESPACHADO', 'CANCELADO'].includes(this.detalle.formula.estado)) return false;
    return this.detalle.medicamentos.some(m => this.cantidadSeleccionada(m) > 0) &&
      this.detalle.medicamentos.every(m => this.cantidadSeleccionada(m) <= m.prescripcion.pendiente &&
        m.lotes.every(l => {
          const n = this.cantidades[l.id] ?? 0;
          return Number.isInteger(n) && n >= 0 && n <= l.cantidad;
        }));
  }

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

  nombreLote(d: DetalleDespacho, l: SeleccionLote) {
    const medicamento = d.medicamentos.find(m => m.prescripcion.medicamento === l.medicamento);
    const lote = medicamento?.lotes.find(x => x.id === l.lote);
    return (medicamento?.prescripcion.nombre ?? l.medicamento) + ' · lote ' + (lote?.numero ?? l.lote);
  }

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

  cambiar(d: DetalleDespacho, accion: 'cancelar' | 'disponibilidad', motivo: string) {
    if (!motivo.trim() || (accion === 'cancelar' && !confirm('¿Cancelar este despacho?'))) return;
    void this.operar(async () => {
      this.detalle = await firstValueFrom(this.api.cambiar(d.formula.id, accion, motivo));
      this.cantidades = {};
      await this.cargarFormulas();
    });
  }

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

  descargar(e: EntregaDespacho) {
    return this.operar(async () => descargarClinica(await firstValueFrom(this.api.pdf(e.id)), 'despacho-' + e.id + '.pdf'));
  }

  etiqueta(estado: string) {
    return estado.toLowerCase().replaceAll('_', ' ');
  }

  private cargarFormulas() {
    return firstValueFrom(this.api.formulas(this.params(this.filtros))).then(items => { this.formulas = items; });
  }

  private cargarHistorial() {
    return firstValueFrom(this.api.historial(this.params(this.fechas))).then(items => { this.entregas = items; });
  }

  private async cargarDetalle(id: number) {
    this.detalle = await firstValueFrom(this.api.detalle(id));
    this.cantidades = {};
  }

  private params(filtros: Record<string, string>): Record<string, string | number> {
    return { ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor.trim())), pagina: this.pagina };
  }

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
