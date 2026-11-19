import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable, switchMap, tap } from 'rxjs';
import { FichaInventario } from '../../../models/inventario';
import { InventarioService } from '../../../services/inventario.service';
import {
  AtencionClinica, ClinicaService, DatosClinicos, descargarClinica,
  FormulaClinica, LineaFormula, mensajeClinica
} from '../../../services/clinica.service';

@Component({
  selector: 'app-atencion-clinica',
  imports: [CommonModule, FormsModule],
  templateUrl: './atencion-clinica.component.html'
})
export class AtencionClinicaComponent implements OnChanges {
  private readonly api = inject(ClinicaService);
  private readonly inventario = inject(InventarioService);
  @Input({ required: true }) citaId!: number;
  @Output() cierre = new EventEmitter<void>();
  @Output() actualizada = new EventEmitter<void>();
  datos: AtencionClinica | null = null;
  campos: DatosClinicos | null = null;
  seleccion: {servicioId: number; nombre: string; cantidad: number}[] = [];
  servicioId: number | null = null;
  medicamentos: FichaInventario[] = [];
  formulario: LineaFormula[] | null = null;
  editando: FormulaClinica | null = null;
  ocupado = false;
  error = '';
  aviso = '';

  ngOnChanges() {
    this.datos = null;
    this.formulario = null;
    this.editarDatos(this.api.consultar(this.citaId));
  }

  abrir() { this.editarDatos(this.api.abrir(this.citaId)); }

  guardar() {
    if (!this.campos) return;
    this.editarDatos(this.api.guardar(this.citaId, this.campos, this.seleccion), 'Atención guardada.');
  }

  agregarServicio() {
    const item = this.datos?.catalogo.find(c => c.servicio.id === this.servicioId);
    if (!item?.tarifa || this.seleccion.some(s => s.servicioId === item.servicio.id)) return;
    this.seleccion.push({ servicioId: item.servicio.id, nombre: item.servicio.nombre, cantidad: 1 });
    this.servicioId = null;
  }

  finalizar() {
    if (!this.campos || !confirm('¿Guardar y finalizar la atención? Quedará disponible la prefactura.')) return;
    this.editarDatos(this.api.guardar(this.citaId, this.campos, this.seleccion).pipe(
      tap(datos => this.aplicar(datos)),
      switchMap(datos => this.api.finalizar(this.citaId, datos.atencion!.version))
    ), 'Atención finalizada.');
  }

  nuevaFormula(f?: FormulaClinica) {
    this.editando = f ?? null;
    this.formulario = f ? f.medicamentos.map(x => ({ ...x })) : [];
    if (!f) this.agregarMedicamento();
    this.operar(this.inventario.listar(), lista => {
      this.medicamentos = lista.filter(x => x.producto.tipo === 'MEDICAMENTO' && x.producto.activo);
    });
  }

  agregarMedicamento() {
    this.formulario?.push({ medicamentoId: null, dosis: '', frecuencia: '', duracion: '',
      cantidad: 1, via: '', indicaciones: null });
  }

  existencias(id: number | null) {
    return this.medicamentos.find(m => m.id === id)?.disponible ?? 0;
  }

  guardarFormula(lineas: LineaFormula[]) {
    this.operar(this.api.guardarFormula(this.citaId, this.editando, lineas), f => {
      this.reemplazarFormula(f);
      this.formulario = null;
      this.aviso = 'Borrador de fórmula guardado.';
    });
  }

  resolver(f: FormulaClinica, accion: 'confirmar' | 'anular') {
    if (!confirm(accion === 'confirmar' ? '¿Confirmar la fórmula?' : '¿Anular este borrador?')) return;
    this.operar(this.api.resolverFormula(f, accion), resultado => {
      this.reemplazarFormula(resultado);
      if (this.editando?.id === f.id) this.formulario = null;
      this.aviso = accion === 'confirmar' ? 'Fórmula confirmada.' : 'Borrador anulado.';
    });
  }

  pdf(f: FormulaClinica) { this.operar(this.api.formulaPdf(f.id), b => descargarClinica(b, 'formula-' + f.id + '.pdf')); }
  prefactura() {
    this.operar(this.api.prefactura(this.citaId), b => descargarClinica(b, 'prefactura-' + this.citaId + '.pdf'));
  }

  private reemplazarFormula(f: FormulaClinica) {
    if (!this.datos) return;
    this.datos = { ...this.datos, formulas: [f, ...this.datos.formulas.filter(x => x.id !== f.id)] };
    this.actualizada.emit();
  }

  private editarDatos(req: Observable<AtencionClinica>, aviso = '') {
    this.operar(req, datos => { this.aplicar(datos); this.aviso = aviso; if (aviso) this.actualizada.emit(); });
  }

  private aplicar(datos: AtencionClinica) {
    this.datos = datos;
    const a = datos.atencion;
    this.campos = a ? { version: a.version, motivo: a.motivo, sintomas: a.sintomas, diagnostico: a.diagnostico,
      observaciones: a.observaciones, recomendaciones: a.recomendaciones } : null;
    this.seleccion = datos.servicios.map(x => ({ servicioId: x.servicioId, nombre: x.nombre, cantidad: x.cantidad }));
  }

  private operar<T>(req: Observable<T>, ok: (dato: T) => void) {
    this.error = ''; this.aviso = ''; this.ocupado = true;
    req.pipe(finalize(() => { this.ocupado = false; })).subscribe({
      next: ok, error: async e => { this.error = await mensajeClinica(e); }
    });
  }
}
