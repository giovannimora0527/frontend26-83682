import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../cliente/service/cliente.service';
import { MedicoService } from '../medico/service/medico.service';
import { AnotacionClinica, AnotacionRequest, Cita, HistoriaClinica, HistoriaClinicaRequest, MascotaResumen, Veterinario } from 'src/app/models/clinica';
import { Cliente } from 'src/app/models/cliente';
import { CitaService } from '../cita/service/cita.service';
import { HistoriaClinicaService } from './service/historia-clinica.service';
import { apiErrorMessage } from 'src/app/services/api-error';

@Component({ selector: 'app-historia-clinica', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule], templateUrl: './historia-clinica.component.html', styleUrls: ['./historia-clinica.component.scss'] })
export class HistoriaClinicaComponent implements OnInit {
  historias: HistoriaClinica[] = []; clientes: Cliente[] = []; mascotas: MascotaResumen[] = []; veterinarios: Veterinario[] = []; citasAtendidas: Cita[] = [];
  anotaciones: AnotacionClinica[] = []; historiaSeleccionada: HistoriaClinica | null = null; anotacionDetalle: AnotacionClinica | null = null;
  cargandoAnotacion = false; errorAnotacion = '';
  pagina = 0; tamanio = 10; totalPaginas = 0; totalElementos = 0; paginaNotas = 0; paginasNotas = 0; totalNotas = 0;
  orden = 'fechaHora'; direccion: 'ASC' | 'DESC' = 'DESC';
  readonly tamanios = [10, 20, 50];
  filtroCliente = ''; filtroMascota = ''; filtroVeterinario = ''; filtroFecha = '';
  cargando = false; cargandoMascotas = false; cargandoDetalle = false; cargandoAnotaciones = false; guardando = false; guardandoNota = false;
  error = ''; errorFormulario = ''; errorDetalle = ''; errorNota = ''; errorMascotas = '';
  exito = '';
  errorOpciones = '';
  private solicitudMascotas = 0;
  modalAbierto = false; modalNotaAbierto = false; formulario: FormGroup; formularioNota: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly api: HistoriaClinicaService, private readonly clienteApi: ClienteService, private readonly vetApi: MedicoService, private readonly citasApi: CitaService) {
    this.formulario = this.fb.group({ clienteId: [null, Validators.required], mascotaId: [{ value: null, disabled: true }, Validators.required], citaId: [null], veterinarioId: [null, Validators.required], fechaHora: ['', Validators.required], motivoConsulta: ['', [Validators.required, Validators.maxLength(500)]], diagnostico: ['', [Validators.required, Validators.maxLength(2000)]], observaciones: ['', Validators.maxLength(2000)] });
    this.formularioNota = this.fb.group({ veterinarioId: [null, Validators.required], descripcion: ['', [Validators.required, Validators.maxLength(500)]], observacion: ['', [Validators.required, Validators.maxLength(2000)]], diagnosticoEvolucion: ['', [Validators.required, Validators.maxLength(2000)]] });
  }
  ngOnInit(): void {
    this.clienteApi.listarClientes().subscribe({ next: x => this.clientes = x, error: () => this.errorOpciones = 'No se pudieron cargar los clientes.' });
    this.vetApi.listar().subscribe({ next: x => this.veterinarios = x, error: () => this.errorOpciones = 'No se pudieron cargar los veterinarios.' });
    this.citasApi.listar({ page: 0, size: 100, estado: 'ATENDIDA' }).subscribe({ next: x => this.citasAtendidas = x.content ?? [], error: () => this.citasAtendidas = [] });
    this.listar();
  }
  listar(): void {
    this.cargando = true; this.error = '';
    this.api.listar({ page: this.pagina, size: this.tamanio, sort: this.orden, direction: this.direccion, clienteId: this.filtroCliente ? +this.filtroCliente : undefined, mascotaId: this.filtroMascota ? +this.filtroMascota : undefined, veterinarioId: this.filtroVeterinario ? +this.filtroVeterinario : undefined, fecha: this.filtroFecha || undefined }).subscribe({
      next: x => { this.historias = x.content ?? []; this.totalPaginas = x.totalPages ?? 0; this.totalElementos = x.totalElements ?? 0; this.cargando = false; }, error: e => { this.error = this.mensajeError(e, 'No se pudieron cargar las historias clínicas.'); this.cargando = false; }
    });
  }
  aplicarFiltros(): void { this.pagina = 0; this.listar(); }
  limpiarFiltros(): void { this.filtroCliente = ''; this.filtroMascota = ''; this.filtroVeterinario = ''; this.filtroFecha = ''; this.aplicarFiltros(); }
  cambiarFiltroCliente(): void { this.filtroMascota = ''; const id = Number(this.filtroCliente); this.mascotas = []; if (id) this.clienteApi.listarMascotas(id).subscribe({ next: rows => this.mascotas = rows, error: () => this.error = 'No se pudieron cargar las mascotas del cliente seleccionado.' }); this.aplicarFiltros(); }
  cambiarPagina(p: number): void { if (p >= 0 && p < this.totalPaginas) { this.pagina = p; this.listar(); } }
  cambiarTamanio(v: string): void { this.tamanio = +v; this.pagina = 0; this.listar(); }
  ordenarPor(campo: string): void { this.direccion = this.orden === campo && this.direccion === 'DESC' ? 'ASC' : 'DESC'; this.orden = campo; this.pagina = 0; this.listar(); }
  abrirCrear(): void { this.formulario.reset(); this.formulario.controls['mascotaId'].disable(); this.errorFormulario = ''; this.modalAbierto = true; }
  cambiarCliente(): void {
    this.solicitudMascotas++;
    this.cargandoMascotas = false;
    this.errorMascotas = '';
    this.errorFormulario = '';
    const id = Number(this.formulario.controls['clienteId'].value);
    this.formulario.controls['mascotaId'].reset();
    this.formulario.controls['mascotaId'].disable();
    this.formulario.controls['citaId'].reset();
    this.mascotas = [];
    if (this.esIdValido(id)) this.cargarMascotas(id);
  }
  private cargarMascotas(clienteId: number, seleccionada?: number): void {
    const solicitud = ++this.solicitudMascotas;
    this.mascotas = [];
    this.errorMascotas = '';
    this.formulario.controls['mascotaId'].disable();
    this.cargandoMascotas = true;
    this.clienteApi.listarMascotas(clienteId).subscribe({
      next: xs => {
        if (solicitud !== this.solicitudMascotas) return;
        this.mascotas = xs.filter(m => (m.clienteId ?? m.cliente?.clienteId ?? m.cliente?.id) === clienteId);
        if (this.mascotas.length > 0) this.formulario.controls['mascotaId'].enable();
        else this.formulario.controls['mascotaId'].disable();
        if (seleccionada && this.mascotas.some(m => this.idMascota(m) === seleccionada)) this.formulario.controls['mascotaId'].setValue(seleccionada);
        if (xs.length > 0 && this.mascotas.length === 0) this.errorMascotas = 'La respuesta no incluye el cliente asociado a sus mascotas; no se pueden mostrar con seguridad.';
        this.cargandoMascotas = false;
      },
      error: e => {
        if (solicitud !== this.solicitudMascotas) return;
        this.errorMascotas = this.mensajeError(e, 'No se pudieron cargar las mascotas del cliente.');
        this.cargandoMascotas = false;
      }
    });
  }
  cambiarCita(): void {
    const cita = this.citasAtendidas.find(x => x.id === Number(this.formulario.controls['citaId'].value));
    if (!cita) return;
    this.formulario.patchValue({ clienteId: cita.clienteId, mascotaId: cita.mascotaId, veterinarioId: cita.veterinarioId, fechaHora: `${cita.fecha}T${cita.hora.slice(0, 5)}`, motivoConsulta: cita.motivoConsulta });
    this.cargarMascotas(cita.clienteId, cita.mascotaId);
  }
  guardar(): void {
    if (this.formulario.invalid || this.guardando || this.cargandoMascotas) { this.formulario.markAllAsTouched(); return; }
    const v = this.formulario.getRawValue();
    const clienteId = Number(v.clienteId);
    const mascotaId = Number(v.mascotaId);
    const veterinarioId = Number(v.veterinarioId);
    if (!this.esIdValido(clienteId) || !this.clientes.some(c => this.idCliente(c) === clienteId)) { this.errorFormulario = 'Selecciona un cliente existente.'; return; }
    if (!this.esIdValido(veterinarioId) || !this.veterinarios.some(vet => this.idVeterinario(vet) === veterinarioId)) { this.errorFormulario = 'Selecciona un veterinario existente con un identificador válido.'; return; }
    const mascota = this.mascotas.find(m => this.idMascota(m) === mascotaId);
    const clienteMascotaId = mascota?.clienteId ?? mascota?.cliente?.clienteId ?? mascota?.cliente?.id;
    if (!this.esIdValido(mascotaId) || !mascota || clienteMascotaId !== clienteId) { this.errorFormulario = 'Selecciona una mascota existente que pertenezca al cliente elegido.'; return; }
    const citaSeleccionada = v.citaId !== null && v.citaId !== undefined && v.citaId !== '';
    const citaId = citaSeleccionada ? Number(v.citaId) : undefined;
    if (citaSeleccionada) {
      const cita = this.citasAtendidas.find(c => c.id === citaId);
      if (!this.esIdValido(citaId) || !cita || cita.estado !== 'ATENDIDA' || cita.clienteId !== clienteId || cita.mascotaId !== mascotaId || cita.veterinarioId !== veterinarioId) {
        this.errorFormulario = 'La cita asociada debe existir, estar atendida y coincidir con cliente, mascota y veterinario.';
        return;
      }
    }
    const fechaHora = String(v.fechaHora).length === 16 ? `${v.fechaHora}:00` : v.fechaHora;
    const observaciones = String(v.observaciones ?? '').trim();
    const payload: HistoriaClinicaRequest = { clienteId, mascotaId, ...(citaId !== undefined ? { citaId } : {}), veterinarioId, fechaHora, motivoConsulta: String(v.motivoConsulta).trim(), diagnostico: String(v.diagnostico).trim(), ...(observaciones ? { observaciones } : {}) };
    this.guardando = true; this.errorFormulario = '';
    this.api.crear(payload).subscribe({ next: () => { this.guardando = false; this.modalAbierto = false; this.formulario.reset(); this.formulario.controls['mascotaId'].disable(); this.mascotas = []; this.filtroCliente = ''; this.filtroMascota = ''; this.filtroVeterinario = ''; this.filtroFecha = ''; this.pagina = 0; this.exito = 'Historia clínica creada correctamente.'; this.listar(); }, error: e => { this.guardando = false; this.errorFormulario = this.mensajeError(e, 'No se pudo crear la historia clínica.'); } });
  }
  verDetalle(h: HistoriaClinica): void {
    const historiaClinicaId = h.historiaClinicaId ?? h.id;
    this.historiaSeleccionada = h;
    this.anotacionDetalle = null;
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    if (!this.esIdValido(historiaClinicaId)) {
      this.errorDetalle = 'La historia no contiene un historiaClinicaId válido.';
      this.cargandoDetalle = false;
      return;
    }
    this.api.consultar(historiaClinicaId).subscribe({
      next: detalle => {
        this.historiaSeleccionada = detalle.historia;
        this.anotaciones = detalle.anotaciones.content ?? [];
        this.paginaNotas = detalle.anotaciones.page ?? 0;
        this.paginasNotas = detalle.anotaciones.totalPages ?? 0;
        this.totalNotas = detalle.anotaciones.totalElements ?? 0;
        this.cargandoAnotaciones = false;
        this.cargandoDetalle = false;
      },
      error: e => {
        this.errorDetalle = this.mensajeError(e, 'No se pudo consultar la historia clínica.');
        this.cargandoDetalle = false;
      }
    });
  }
  listarAnotaciones(): void {
    if (!this.historiaSeleccionada) return;
    const historiaClinicaId = this.historiaSeleccionada.historiaClinicaId ?? this.historiaSeleccionada.id;
    if (!this.esIdValido(historiaClinicaId)) { this.errorDetalle = 'La historia no contiene un historiaClinicaId válido.'; return; }
    this.cargandoAnotaciones = true;
    this.api.listarAnotaciones(historiaClinicaId, this.paginaNotas, 20).subscribe({ next: p => { this.anotaciones = p.content ?? []; this.paginasNotas = p.totalPages ?? 0; this.totalNotas = p.totalElements ?? 0; this.cargandoAnotaciones = false; }, error: e => { this.errorDetalle = this.mensajeError(e, 'No se pudieron consultar las anotaciones.'); this.cargandoAnotaciones = false; } });
  }
  cambiarPaginaNotas(p: number): void { if (p >= 0 && p < this.paginasNotas) { this.paginaNotas = p; this.listarAnotaciones(); } }
  abrirAnotacion(): void { this.formularioNota.reset(); this.errorNota = ''; this.modalNotaAbierto = true; }
  guardarAnotacion(): void { if (!this.historiaSeleccionada || this.formularioNota.invalid || this.guardandoNota) { this.formularioNota.markAllAsTouched(); return; } const v = this.formularioNota.getRawValue(); const data: AnotacionRequest = { historiaClinicaId: this.historiaSeleccionada.id, veterinarioId: Number(v.veterinarioId), fechaHora: v.fechaHora ? (String(v.fechaHora).length === 16 ? `${v.fechaHora}:00` : v.fechaHora) : undefined, descripcion: String(v.descripcion).trim(), observacion: String(v.observacion).trim(), diagnosticoEvolucion: String(v.diagnosticoEvolucion).trim() }; this.guardandoNota = true; this.errorNota = ''; this.api.crearAnotacion(data).subscribe({ next: () => { this.guardandoNota = false; this.modalNotaAbierto = false; this.exito = 'Anotación clínica creada correctamente.'; this.paginaNotas = 0; this.listarAnotaciones(); }, error: e => { this.guardandoNota = false; this.errorNota = this.mensajeError(e, 'No se pudo crear la anotación.'); } }); }
  verAnotacion(n: AnotacionClinica): void {
    const anotacionId = n.anotacionId ?? n.id;
    this.anotacionDetalle = null;
    this.errorAnotacion = '';
    if (!this.esIdValido(anotacionId)) {
      this.errorAnotacion = 'La anotación no contiene un identificador válido.';
      return;
    }
    this.cargandoAnotacion = true;
    this.api.consultarAnotacion(anotacionId).subscribe({
      next: anotacion => { this.anotacionDetalle = anotacion; this.cargandoAnotacion = false; },
      error: e => { this.errorAnotacion = this.mensajeError(e, 'No se pudo consultar el detalle de la anotación.'); this.cargandoAnotacion = false; }
    });
  }
  cerrarDetalleAnotacion(): void { this.anotacionDetalle = null; this.errorAnotacion = ''; this.cargandoAnotacion = false; }
  cerrarDetalle(): void { this.historiaSeleccionada = null; this.anotaciones = []; this.cerrarDetalleAnotacion(); this.modalNotaAbierto = false; }
  cerrarModal(): void { this.modalAbierto = false; this.errorFormulario = ''; }
  idCliente(c: Cliente): number | undefined { return c.clienteId ?? c.id; }
  idVeterinario(v: Veterinario): number | undefined { return v.veterinarioId ?? v.id; }
  private esIdValido(id: number | undefined): id is number { return id !== undefined && Number.isSafeInteger(id) && id > 0; }
  etiquetaCliente(c?: Cliente): string { return c ? `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() : 'No disponible'; }
  idMascota(m: MascotaResumen): number | undefined { return m.mascotaId ?? m.id; }
  etiquetaMascota(m?: MascotaResumen): string { return m?.nombreMascota ?? m?.nombre ?? 'No disponible'; }
  etiquetaVet(v?: Veterinario): string { return v ? `${v.nombres} ${v.apellidos}`.trim() : 'No disponible'; }
  nombreVet(id: number): string { const v = this.veterinarios.find(x => this.idVeterinario(x) === id); return v ? this.etiquetaVet(v) : 'No disponible'; }
  clienteDeHistoria(h: HistoriaClinica): string { return h.cliente ? this.etiquetaCliente(h.cliente) : h.clienteNombre ?? 'No disponible'; }
  mascotaDeHistoria(h: HistoriaClinica): string { return h.mascota ? this.etiquetaMascota(h.mascota) : h.mascotaNombre ?? `Mascota ${h.mascotaId}`; }
  veterinarioDeHistoria(h: HistoriaClinica): string { return h.veterinario ? this.etiquetaVet(h.veterinario) : h.veterinarioNombre ?? this.nombreVet(h.veterinarioId); }
  nombreVetAnotacion(n: AnotacionClinica): string { return n.veterinarioNombre ?? this.nombreVet(n.veterinarioId); }
  private mensajeError(e: unknown, fallback: string): string {
    if (typeof e === 'object' && e !== null && 'error' in e) {
      const body = (e as { error?: unknown }).error;
      if (typeof body === 'string' && body.trim()) return body;
      if (typeof body === 'object' && body !== null) {
        const response = body as { message?: unknown; mensaje?: unknown };
        const message = response.message ?? response.mensaje;
        if (typeof message === 'string' && message.trim()) return message;
      }
    }
    return apiErrorMessage(e, fallback);
  }
}
