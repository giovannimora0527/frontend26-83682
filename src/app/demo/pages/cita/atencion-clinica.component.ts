import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable, switchMap, tap } from 'rxjs';
import { FichaInventario } from '../../../models/inventario';
import { InventarioService } from '../../../services/inventario.service';
import { AuthService } from '../../../services/auth.service';
import { calcularCantidad } from '../../../utils/cantidad-formula';
import {
  AtencionClinica, ClinicaService, DatosClinicos, descargarClinica,
  FormulaClinica, LineaFormula, mensajeClinica
} from '../../../services/clinica.service';

/** Pantalla «atención clínica» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-atencion-clinica',
  imports: [CommonModule, FormsModule],
  templateUrl: './atencion-clinica.component.html'
})
export class AtencionClinicaComponent implements OnChanges {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(ClinicaService);
  /** Dependencia inyectada (InventarioService). */
  private readonly inventario = inject(InventarioService);
  /** Dependencia inyectada (AuthService). */
  private readonly auth = inject(AuthService);
  /** Solo el veterinario (ATENCION_GESTIONAR) abre, edita y finaliza; los demás roles consultan. */
  readonly puedeAtender = this.auth.tienePermiso('ATENCION_GESTIONAR');
  /** Indica si puede crear, editar y confirmar fórmulas. */
  readonly puedeFormular = this.auth.tienePermiso('FORMULA_GESTIONAR');
  /** Indica si puede descargar la prefactura. */
  readonly puedePrefactura = this.auth.tienePermiso('PREFACTURA_GENERAR');
  /** Datos. */
  /** Indica si actualizada. */
  /** Cierre. */
  /** Identificador de cita. */
  @Input({ required: true }) citaId!: number;
  @Output() cierre = new EventEmitter<void>();
  @Output() actualizada = new EventEmitter<void>();
  datos: AtencionClinica | null = null;
  /** Campos. */
  campos: DatosClinicos | null = null;
  /** Lista de seleccion. */
  seleccion: {servicioId: number; nombre: string; cantidad: number}[] = [];
  /** Identificador de servicio. */
  servicioId: number | null = null;
  /** Lista de medicamentos. */
  medicamentos: FichaInventario[] = [];
  /** Formulario reactivo: formulario. */
  formulario: LineaFormula[] | null = null;
  /** Indica si se está editando. */
  editando: FormulaClinica | null = null;
  /** Indica si ocupado. */
  ocupado = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';

  /** Reacciona a los cambios en las entradas del componente. */
  ngOnChanges() {
    this.datos = null;
    this.formulario = null;
    this.editarDatos(this.api.consultar(this.citaId));
  }

  /** Abre los datos de la pantalla. */
  abrir() { this.editarDatos(this.api.abrir(this.citaId)); }

  /** Guarda los datos de la pantalla validando el formulario y enviándolo al backend. */
  guardar() {
    if (!this.campos) return;
    this.editarDatos(this.api.guardar(this.citaId, this.campos, this.seleccion), 'Atención guardada.');
  }

  /** Agrega servicio. */
  agregarServicio() {
    const item = this.datos?.catalogo.find(c => c.servicio.id === this.servicioId);
    if (!item?.tarifa || this.seleccion.some(s => s.servicioId === item.servicio.id)) return;
    this.seleccion.push({ servicioId: item.servicio.id, nombre: item.servicio.nombre, cantidad: 1 });
    this.servicioId = null;
  }

  /** Finaliza los datos de la pantalla. */
  finalizar() {
    if (!this.campos || !confirm('¿Guardar y finalizar la atención? Quedará disponible la prefactura.')) return;
    this.editarDatos(this.api.guardar(this.citaId, this.campos, this.seleccion).pipe(
      tap(datos => this.aplicar(datos)),
      switchMap(datos => this.api.finalizar(this.citaId, datos.atencion!.version))
    ), 'Atención finalizada.');
  }

  /**
   * Prepara el formulario para un nuevo registro de fórmula.
   *
   * @param f f.
   */
  nuevaFormula(f?: FormulaClinica) {
    this.editando = f ?? null;
    this.formulario = f ? f.medicamentos.map(x => ({ ...x })) : [];
    if (!f) this.agregarMedicamento();
    this.operar(this.inventario.listar(), lista => {
      this.medicamentos = lista.filter(x => x.producto.tipo === 'MEDICAMENTO' && x.producto.activo);
    });
  }

  /** Agrega medicamento. */
  agregarMedicamento() {
    this.formulario?.push({ medicamentoId: null, dosis: '', frecuencia: '', duracion: '',
      cantidad: 1, via: '', indicaciones: null });
  }

  /**
   * Existencias.
   *
   * @param id identificador del registro.
   */
  existencias(id: number | null) {
    return this.medicamentos.find(m => m.id === id)?.disponible ?? 0;
  }

  /**
   * Cantidad a dispensar de una línea: dosis × tomas por día × días (la misma regla que aplica el backend).
   *
   * @param l línea de la fórmula.
   * @returns unidades calculadas.
   */
  cantidadCalculada(l: LineaFormula): number {
    l.cantidad = calcularCantidad(l.dosis, l.frecuencia, l.duracion);
    return l.cantidad;
  }

  /**
   * Guarda fórmula validando el formulario y enviándolo al backend.
   *
   * @param lineas lineas.
   */
  guardarFormula(lineas: LineaFormula[]) {
    this.operar(this.api.guardarFormula(this.citaId, this.editando, lineas), f => {
      this.reemplazarFormula(f);
      this.formulario = null;
      this.aviso = 'Borrador de fórmula guardado.';
    });
  }

  /**
   * Resuelve los datos de la pantalla.
   *
   * @param f f.
   * @param accion acción.
   */
  resolver(f: FormulaClinica, accion: 'confirmar' | 'anular') {
    if (!confirm(accion === 'confirmar' ? '¿Confirmar la fórmula?' : '¿Anular este borrador?')) return;
    this.operar(this.api.resolverFormula(f, accion), resultado => {
      this.reemplazarFormula(resultado);
      if (this.editando?.id === f.id) this.formulario = null;
      this.aviso = accion === 'confirmar' ? 'Fórmula confirmada.' : 'Borrador anulado.';
    });
  }

  /**
   * Descarga el PDF los datos de la pantalla.
   *
   * @param f f.
   */
  pdf(f: FormulaClinica) { this.operar(this.api.formulaPdf(f.id), b => descargarClinica(b, 'formula-' + f.id + '.pdf')); }
  /** Descarga la prefactura en PDF. */
  prefactura() {
    this.operar(this.api.prefactura(this.citaId), b => descargarClinica(b, 'prefactura-' + this.citaId + '.pdf'));
  }

  /**
   * Reemplaza fórmula.
   *
   * @param f f.
   */
  private reemplazarFormula(f: FormulaClinica) {
    if (!this.datos) return;
    this.datos = { ...this.datos, formulas: [f, ...this.datos.formulas.filter(x => x.id !== f.id)] };
    this.actualizada.emit();
  }

  /**
   * Prepara el formulario para editar datos.
   *
   * @param req solicitud HTTP saliente.
   * @param aviso aviso.
   */
  private editarDatos(req: Observable<AtencionClinica>, aviso = '') {
    this.operar(req, datos => { this.aplicar(datos); this.aviso = aviso; if (aviso) this.actualizada.emit(); });
  }

  /**
   * Aplica los datos de la pantalla.
   *
   * @param datos datos a enviar.
   */
  private aplicar(datos: AtencionClinica) {
    this.datos = datos;
    const a = datos.atencion;
    this.campos = a ? { version: a.version, motivo: a.motivo, sintomas: a.sintomas, diagnostico: a.diagnostico,
      observaciones: a.observaciones, recomendaciones: a.recomendaciones } : null;
    this.seleccion = datos.servicios.map(x => ({ servicioId: x.servicioId, nombre: x.nombre, cantidad: x.cantidad }));
  }

  /**
   * Ejecuta la operación los datos de la pantalla.
   *
   * @param req solicitud HTTP saliente.
   * @param ok ok.
   */
  private operar<T>(req: Observable<T>, ok: (dato: T) => void) {
    this.error = ''; this.aviso = ''; this.ocupado = true;
    req.pipe(finalize(() => { this.ocupado = false; })).subscribe({
      next: ok, error: async e => { this.error = await mensajeClinica(e); }
    });
  }
}
