import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { FormulaMedica, FormulaMedicaRequest, HistoriaClinica, MascotaResumen, Veterinario } from 'src/app/models/clinica';
import { Cliente } from 'src/app/models/cliente';
import { FormulaMedicaService } from './service/formula-medica.service';
import { HistoriaClinicaService } from '../historia-clinica/service/historia-clinica.service';
import { apiErrorMessage } from 'src/app/services/api-error';

@Component({
  selector: 'app-formula-medica', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html', styleUrls: ['./formula-medica.component.scss']
})
export class FormulaMedicaComponent implements OnInit {
  formulas: FormulaMedica[] = [];
  clientes: Cliente[] = [];
  mascotas: MascotaResumen[] = [];
  veterinarios: Veterinario[] = [];
  historias: HistoriaClinica[] = [];
  cargando = false;
  cargandoFormulario = false;
  cargandoHistorias = false;
  guardando = false;
  cargandoDetalle = false;
  error = '';
  exito = '';
  errorOpciones = '';
  errorFormulario = '';
  errorDetalle = '';
  busqueda = '';
  filtroCliente = '';
  filtroMascota = '';
  filtroVeterinario = '';
  filtroMedicamento = '';
  filtroFecha = '';
  pagina = 0;
  tamanio = 10;
  totalPaginas = 0;
  totalElementos = 0;
  readonly tamanios = [10, 20, 50];
  orden = 'fechaCreacionRegistro';
  direccion: 'ASC' | 'DESC' = 'DESC';
  formulario!: FormGroup;
  modalAbierto = false;
  modo: 'crear' | 'editar' = 'crear';
  editandoId: number | null = null;
  detalle: FormulaMedica | null = null;

  constructor(private readonly fb: FormBuilder, private readonly formulasApi: FormulaMedicaService,
    private readonly clientesApi: ClienteService, private readonly mascotasApi: MascotaService,
    private readonly veterinariosApi: MedicoService, private readonly historiasApi: HistoriaClinicaService) {
    this.formulario = this.fb.group({
      mascotaId: [null, Validators.required], historiaClinicaId: [null], veterinarioId: [null, Validators.required],
      fechaEmision: ['', Validators.required], medicamento: ['', [Validators.required, Validators.maxLength(180)]],
      dosis: [null, [Validators.required, Validators.min(0.01)]], frecuencia: ['', [Validators.required, Validators.maxLength(120)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      indicaciones: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    this.cargarOpciones();
    this.listar();
  }

  cargarOpciones(): void {
    this.clientesApi.listarClientes().subscribe({ next: data => this.clientes = data, error: () => this.errorOpciones = 'No se pudieron cargar los clientes.' });
    this.mascotasApi.listarMascotas().subscribe({ next: data => this.mascotas = data, error: () => this.errorOpciones = 'No se pudieron cargar las mascotas.' });
    this.veterinariosApi.listar().subscribe({ next: data => this.veterinarios = data, error: () => this.errorOpciones = 'No se pudieron cargar los veterinarios.' });
  }

  listar(): void {
    this.cargando = true; this.error = '';
    this.formulasApi.listar({ page: this.pagina, size: this.tamanio, sort: this.orden, direction: this.direccion,
      clienteId: this.filtroCliente ? Number(this.filtroCliente) : undefined,
      mascotaId: this.filtroMascota ? Number(this.filtroMascota) : undefined,
      veterinarioId: this.filtroVeterinario ? Number(this.filtroVeterinario) : undefined,
      medicamento: this.filtroMedicamento || this.busqueda || undefined, fecha: this.filtroFecha || undefined
    }).subscribe({
      next: page => { this.formulas = (page.content ?? []).map(f => ({ ...f, id: f.id ?? f.formulaMedicaId ?? f.formulaId ?? 0 })); this.totalPaginas = page.totalPages ?? 0; this.totalElementos = page.totalElements ?? 0; this.cargando = false; },
      error: err => { this.error = this.mensajeError(err, 'No se pudieron cargar las fórmulas médicas.'); this.cargando = false; }
    });
  }

  aplicarFiltros(): void { this.exito = ''; this.pagina = 0; this.listar(); }
  limpiarFiltros(): void { this.busqueda = ''; this.filtroCliente = ''; this.filtroMascota = ''; this.filtroVeterinario = ''; this.filtroMedicamento = ''; this.filtroFecha = ''; this.aplicarFiltros(); }
  cambiarPagina(next: number): void { if (next >= 0 && next < this.totalPaginas) { this.pagina = next; this.listar(); } }
  cambiarTamanio(value: string): void { this.tamanio = Number(value); this.pagina = 0; this.listar(); }
  ordenarPor(campo: string): void { this.direccion = this.orden === campo && this.direccion === 'DESC' ? 'ASC' : 'DESC'; this.orden = campo; this.pagina = 0; this.listar(); }

  abrirCrear(): void {
    this.modo = 'crear'; this.editandoId = null; this.historias = []; this.errorFormulario = '';
    this.formulario.reset(); this.modalAbierto = true;
  }

  abrirEditar(formula: FormulaMedica): void {
    this.modo = 'editar'; this.editandoId = formula.id ?? formula.formulaMedicaId ?? formula.formulaId ?? null; this.errorFormulario = ''; this.modalAbierto = true;
    if (this.editandoId === null) { this.errorFormulario = 'La fórmula no tiene un identificador válido.'; return; }
    this.cargandoFormulario = true;
    this.formulasApi.consultar(this.editandoId).subscribe({
      next: detalle => {
        this.formulario.patchValue({ mascotaId: detalle.mascotaId, historiaClinicaId: detalle.historiaClinicaId ?? null,
          veterinarioId: detalle.veterinarioId, fechaEmision: (detalle.fechaEmision ?? '').slice(0, 10), medicamento: detalle.medicamento,
          dosis: detalle.dosis, frecuencia: detalle.frecuencia, duracionDias: detalle.duracionDias, indicaciones: detalle.indicaciones });
        if (detalle.mascotaId) this.cargarHistorias(detalle.mascotaId, detalle.historiaClinicaId);
        this.cargandoFormulario = false;
      }, error: err => { this.errorFormulario = this.mensajeError(err, 'No se pudo consultar la fórmula.'); this.cargandoFormulario = false; }
    });
  }

  cambiarMascota(): void {
    const mascotaId = Number(this.formulario.controls['mascotaId'].value);
    this.formulario.patchValue({ historiaClinicaId: null, veterinarioId: null });
    this.historias = [];
    if (mascotaId) this.cargarHistorias(mascotaId);
  }

  private cargarHistorias(mascotaId: number, seleccionada?: number | null): void {
    this.cargandoHistorias = true;
    this.historiasApi.listar({ page: 0, size: 100, mascotaId }).subscribe({
      next: page => { this.historias = (page.content ?? []).filter(h => (h.mascotaId ?? h.mascota?.mascotaId ?? h.mascota?.id) === mascotaId); if (seleccionada) this.formulario.patchValue({ historiaClinicaId: seleccionada }); this.cargandoHistorias = false; },
      error: err => { this.errorFormulario = this.mensajeError(err, 'No se pudieron cargar las historias clínicas de esta mascota.'); this.cargandoHistorias = false; }
    });
  }

  seleccionarHistoria(): void {
    const id = Number(this.formulario.controls['historiaClinicaId'].value);
    const historia = this.historias.find(h => h.id === id);
    if (historia) this.formulario.patchValue({ veterinarioId: historia.veterinarioId });
  }

  guardar(): void {
    if (this.formulario.invalid || this.guardando || this.cargandoHistorias) { this.formulario.markAllAsTouched(); return; }
    const v = this.formulario.getRawValue();
    const historia = this.historias.find(h => h.id === Number(v.historiaClinicaId));
    const request: FormulaMedicaRequest = { mascotaId: Number(v.mascotaId), historiaClinicaId: v.historiaClinicaId ? Number(v.historiaClinicaId) : undefined,
      veterinarioId: Number(v.veterinarioId), fechaEmision: v.fechaEmision, medicamento: String(v.medicamento).trim(), dosis: Number(v.dosis),
      frecuencia: String(v.frecuencia).trim(), duracionDias: Number(v.duracionDias), indicaciones: String(v.indicaciones).trim() };
    if (historia && (historia.mascotaId !== request.mascotaId || historia.veterinarioId !== request.veterinarioId || request.fechaEmision < historia.fechaHora.slice(0, 10))) {
      this.errorFormulario = 'La historia seleccionada debe corresponder a la mascota y al veterinario, y su fecha no puede ser posterior a la emisión.'; return;
    }
    this.guardando = true; this.errorFormulario = ''; this.exito = '';
    const request$ = this.modo === 'crear' ? this.formulasApi.crear(request) : this.editandoId === null ? null : this.formulasApi.actualizar(this.editandoId, request);
    if (!request$) { this.guardando = false; return; }
    request$.subscribe({ next: () => { this.guardando = false; this.modalAbierto = false; this.exito = this.modo === 'crear' ? 'Fórmula médica creada correctamente.' : 'Fórmula médica actualizada correctamente.'; this.listar(); }, error: err => { this.guardando = false; this.errorFormulario = this.mensajeError(err, 'No se pudo guardar la fórmula.'); } });
  }

  verDetalle(formula: FormulaMedica): void {
    const id = formula.id ?? formula.formulaMedicaId ?? formula.formulaId;
    if (id == null) { this.errorDetalle = 'La fórmula no tiene un identificador válido.'; return; }
    this.detalle = null; this.errorDetalle = ''; this.cargandoDetalle = true;
    this.formulasApi.consultar(id).subscribe({ next: d => { this.detalle = d; this.cargandoDetalle = false; }, error: err => { this.errorDetalle = this.mensajeError(err, 'No se pudo cargar el detalle de la fórmula.'); this.cargandoDetalle = false; } });
  }
  cerrarModal(): void { this.modalAbierto = false; this.errorFormulario = ''; }
  cerrarDetalle(): void { this.detalle = null; this.errorDetalle = ''; }
  idCliente(c: Cliente): number | undefined { return c.clienteId ?? c.id; }
  idMascota(m: MascotaResumen): number | undefined { return m.mascotaId ?? m.id; }
  nombreMascota(m: MascotaResumen): string { return m.nombreMascota ?? m.nombre ?? `Mascota ${this.idMascota(m) ?? ''}`; }
  nombreCliente(c: Cliente): string { return `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(); }
  etiquetaVeterinario(v: Veterinario): string { return `${v.nombres} ${v.apellidos}`.trim(); }
  clienteDeMascota(m: MascotaResumen): number | undefined { return m.clienteId ?? m.cliente?.clienteId ?? m.cliente?.id; }
  /** Nombre de la mascota de la fórmula; si la cita asociada no tiene una mascota registrada lo indica sin inventar datos. */
  mascotaEnFormula(f: FormulaMedica): string {
    if (f.mascotaNombre?.trim()) return f.mascotaNombre;
    if (f.nombreMascota?.trim()) return f.nombreMascota;
    return f.mascotaId ? this.mostrarMascota(f.mascotaId) : 'Mascota no registrada';
  }
  mostrarMascota(id?: number | null): string { const m = this.mascotas.find(x => this.idMascota(x) === id); return m ? this.nombreMascota(m) : 'No disponible'; }
  mostrarVeterinario(id?: number): string { const v = this.veterinarios.find(x => x.id === id); return v ? this.etiquetaVeterinario(v) : 'No disponible'; }
  clienteEnFormula(f: FormulaMedica): string { const c = f.historiaClinica?.cliente; return f.nombreCliente || `${c?.nombres ?? ''} ${c?.apellidos ?? ''}`.trim() || '—'; }
  private mensajeError(err: unknown, fallback: string): string { return apiErrorMessage(err, fallback); }
}
