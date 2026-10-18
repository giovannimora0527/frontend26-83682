import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../cliente/service/cliente.service';
import { MedicoService } from '../medico/service/medico.service';
import { Cita, CitaRequest, EstadoCita, MascotaResumen, Veterinario } from 'src/app/models/clinica';
import { Cliente } from 'src/app/models/cliente';
import { CitaService } from './service/cita.service';
import { apiErrorMessage } from 'src/app/services/api-error';

@Component({ selector: 'app-citas', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule], templateUrl: './citas.component.html', styleUrls: ['./citas.component.scss'] })
export class CitasComponent implements OnInit {
  readonly estados: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'PROGRAMADA'];
  readonly today = new Date();
  citas: Cita[] = []; clientes: Cliente[] = []; mascotas: MascotaResumen[] = []; veterinarios: Veterinario[] = [];
  cargando = false; cargandoMascotas = false; guardando = false; cargandoDetalle = false;
  error = ''; errorFormulario = ''; errorDetalle = ''; busqueda = '';
  exito = '';
  errorOpciones = '';
  filtroCliente = ''; filtroMascota = ''; filtroVeterinario = ''; filtroFecha = ''; filtroEstado: EstadoCita | '' = '';
  pagina = 0; tamanio = 10; totalPaginas = 0; totalElementos = 0; readonly tamanios = [10, 20, 50];
  orden: string | undefined; direccion: 'ASC' | 'DESC' | undefined; formulario: FormGroup;
  modalAbierto = false; modo: 'crear' | 'editar' = 'crear'; editando: Cita | null = null; detalle: Cita | null = null;

  constructor(private readonly fb: FormBuilder, private readonly api: CitaService, private readonly clientesApi: ClienteService, private readonly vetApi: MedicoService) {
    this.formulario = this.fb.group({ clienteId: [null, Validators.required], mascotaId: [{ value: null, disabled: true }, Validators.required], veterinarioId: [null, Validators.required], fecha: ['', Validators.required], hora: ['', Validators.required], motivoConsulta: ['', [Validators.required, Validators.maxLength(500)]], estado: ['PENDIENTE', Validators.required] });
  }
  ngOnInit(): void { this.clientesApi.listarClientes().subscribe({ next: x => this.clientes = x, error: () => this.errorOpciones = 'No se pudieron cargar los clientes.' }); this.vetApi.listar().subscribe({ next: x => this.veterinarios = x, error: () => this.errorOpciones = 'No se pudieron cargar los veterinarios.' }); this.listar(); }
  get estadosFormulario(): EstadoCita[] {
    if (this.modo === 'crear') return ['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA'];
    // Transiciones que acepta el backend (CitaServiceImpl.validTransition).
    return this.editando?.estado === 'PENDIENTE' ? ['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA', 'CANCELADA']
      : [this.editando?.estado ?? 'PENDIENTE', 'ATENDIDA', 'CANCELADA'];
  }
  listar(): void {
    this.cargando = true; this.error = '';
    this.api.listar({ page: this.pagina, size: this.tamanio, sort: this.orden, direction: this.direccion, clienteId: this.filtroCliente ? +this.filtroCliente : undefined, mascotaId: this.filtroMascota ? +this.filtroMascota : undefined, veterinarioId: this.filtroVeterinario ? +this.filtroVeterinario : undefined, fecha: this.filtroFecha || undefined, estado: this.filtroEstado }).subscribe({
      next: p => { this.citas = p.content ?? []; this.totalPaginas = p.totalPages ?? 0; this.totalElementos = p.totalElements ?? 0; this.cargando = false; },
      error: e => { this.error = this.mensajeError(e, 'No se pudieron cargar las citas.'); this.cargando = false; }
    });
  }
  aplicarFiltros(): void { this.pagina = 0; this.listar(); }
  limpiarFiltros(): void { this.busqueda = ''; this.filtroCliente = ''; this.filtroMascota = ''; this.filtroVeterinario = ''; this.filtroFecha = ''; this.filtroEstado = ''; this.aplicarFiltros(); }
  cambiarFiltroCliente(): void { this.filtroMascota = ''; const id = Number(this.filtroCliente); this.mascotas = []; if (id) this.clientesApi.listarMascotas(id).subscribe({ next: rows => this.mascotas = rows, error: () => this.error = 'No se pudieron cargar las mascotas del cliente seleccionado.' }); this.aplicarFiltros(); }
  cambiarPagina(n: number): void { if (n >= 0 && n < this.totalPaginas) { this.pagina = n; this.listar(); } }
  cambiarTamanio(value: string): void { this.tamanio = +value; this.pagina = 0; this.listar(); }
  ordenarPor(field: string): void { this.direccion = this.orden === field && this.direccion === 'DESC' ? 'ASC' : 'DESC'; this.orden = field; this.pagina = 0; this.listar(); }
  buscar(): void { this.aplicarFiltros(); }
  abrirCrear(): void { this.modo = 'crear'; this.editando = null; this.mascotas = []; this.errorFormulario = ''; this.exito = ''; this.formulario.reset({ estado: 'PENDIENTE' }); this.formulario.controls['mascotaId'].disable(); this.modalAbierto = true; }
  abrirEditar(cita: Cita): void {
    if (!this.editable(cita)) return;
    this.modo = 'editar'; this.editando = cita; this.errorFormulario = ''; this.exito = ''; this.modalAbierto = true;
    this.formulario.patchValue({ clienteId: cita.clienteId, veterinarioId: cita.veterinarioId, fecha: cita.fecha, hora: cita.hora?.slice(0, 5), motivoConsulta: cita.motivoConsulta, estado: cita.estado });
    this.cargarMascotas(cita.clienteId, cita.mascotaId);
  }
  cambiarCliente(): void { const id = Number(this.formulario.controls['clienteId'].value); this.formulario.controls['mascotaId'].reset(); this.formulario.controls['mascotaId'].disable(); this.mascotas = []; if (id) this.cargarMascotas(id); }
  private cargarMascotas(clienteId: number, seleccionada?: number): void {
    this.cargandoMascotas = true; this.errorFormulario = '';
    this.clientesApi.listarMascotas(clienteId).subscribe({ next: pets => {
      this.mascotas = pets.filter(p => (p.clienteId ?? p.cliente?.clienteId ?? p.cliente?.id ?? clienteId) === clienteId);
      const control = this.formulario.controls['mascotaId']; control.enable();
      if (seleccionada && this.mascotas.some(p => this.idMascota(p) === seleccionada)) control.setValue(seleccionada);
      this.cargandoMascotas = false;
    }, error: e => { this.errorFormulario = this.mensajeError(e, 'No se pudieron consultar las mascotas del cliente.'); this.cargandoMascotas = false; } });
  }
  guardar(): void {
    if (this.formulario.invalid || this.guardando || this.cargandoMascotas) { this.formulario.markAllAsTouched(); return; }
    const v = this.formulario.getRawValue();
    const clienteId = Number(v.clienteId), mascotaId = Number(v.mascotaId);
    if (!this.mascotas.some(m => this.idMascota(m) === mascotaId && (m.clienteId ?? m.cliente?.clienteId ?? m.cliente?.id ?? clienteId) === clienteId)) { this.errorFormulario = 'Seleccione una mascota perteneciente al cliente elegido.'; return; }
    const payload: CitaRequest = { clienteId, mascotaId, veterinarioId: Number(v.veterinarioId), fecha: v.fecha, hora: `${v.hora}:00`, motivoConsulta: String(v.motivoConsulta).trim(), estado: v.estado };
    this.guardando = true; this.errorFormulario = ''; this.exito = '';
    const request = this.modo === 'crear' ? this.api.crear(payload) : this.editando ? this.api.actualizar(this.editando.id, payload) : null;
    if (!request) { this.guardando = false; return; }
    request.subscribe({ next: () => { this.guardando = false; this.modalAbierto = false; this.exito = this.modo === 'crear' ? 'Cita registrada correctamente.' : 'Cita actualizada correctamente.'; this.listar(); }, error: e => { this.guardando = false; this.errorFormulario = this.mensajeError(e, 'No se pudo guardar la cita.'); } });
  }
  verDetalle(cita: Cita): void { this.cargandoDetalle = true; this.detalle = null; this.errorDetalle = ''; this.api.consultar(cita.id).subscribe({ next: d => { this.detalle = d; this.cargandoDetalle = false; }, error: e => { this.errorDetalle = this.mensajeError(e, 'No se pudo cargar el detalle de la cita.'); this.cargandoDetalle = false; } }); }
  cerrarDetalle(): void { this.detalle = null; this.errorDetalle = ''; }
  cerrarModal(): void { this.modalAbierto = false; this.errorFormulario = ''; }
  idCliente(c: Cliente): number | undefined { return c.clienteId ?? c.id; }
  etiquetaCliente(c?: Cliente): string { return c ? `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() : 'No disponible'; }
  idMascota(m: MascotaResumen): number | undefined { return m.mascotaId ?? m.id; }
  etiquetaMascota(m?: MascotaResumen): string { return m?.nombreMascota ?? m?.nombre ?? 'No disponible'; }
  etiquetaVet(v?: Veterinario): string { return v ? `${v.nombres} ${v.apellidos}`.trim() : 'No disponible'; }
  mascotaEnCita(c: Cita): string { return this.etiquetaMascota(c.mascota) !== 'No disponible' ? this.etiquetaMascota(c.mascota) : c.mascotaNombre ?? (c.mascotaId ? `Mascota ${c.mascotaId}` : 'No disponible'); }
  veterinarioEnCita(c: Cita): string { const veterinario = c.veterinario || c.medico || this.veterinarios.find(v => v.id === c.veterinarioId); return veterinario ? this.etiquetaVet(veterinario) : c.veterinarioNombre ?? (c.veterinarioId ? `Veterinario ${c.veterinarioId}` : 'No disponible'); }
  clienteSeleccionado(id: number): Cliente | undefined { return this.clientes.find(c => this.idCliente(c) === id); }
  etiquetaEstado(estado: EstadoCita): string { return estado.charAt(0) + estado.slice(1).toLowerCase(); }
  editable(c: Cita): boolean { return c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA' || c.estado === 'PROGRAMADA'; }
  private mensajeError(e: unknown, fallback: string): string { return apiErrorMessage(e, fallback); }
}
