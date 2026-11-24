import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../login/service/auth.service';
import { Cliente, ClienteRq } from 'src/app/models/cliente';
import { Factura } from 'src/app/models/factura';
import { Mascota } from 'src/app/models/mascota';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { ClienteService } from './service/cliente.service';

type Consulta = 'mascotas' | 'facturas';

@Component({
  selector: 'app-cliente',
  imports: [
    DatePipe, FormsModule, ReactiveFormsModule, BadgeEstadoComponent, BotonOrdenComponent, PaginacionComponent, FechaHoraPipe, MonedaPipe
  ],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly clienteService = inject(ClienteService);
  private readonly formBuilder = inject(FormBuilder);
  private modal?: NgbModalRef;

  readonly puedeVerFacturas = inject(AuthService).tieneMenu('facturacion');
  readonly hoy = fechaIso(new Date());
  readonly esInvalido = esInvalido;
  readonly tiposDocumento = ['CC', 'CE', 'TI', 'PA', 'NIT'];
  readonly columnas = [
    { clave: 'documento', titulo: 'Documento' },
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'telefono', titulo: 'Teléfono' },
    { clave: 'correo', titulo: 'Correo' },
    { clave: 'direccion', titulo: 'Dirección' }
  ];
  readonly tabla = new Tabla<Cliente>(
    {
      documento: (cliente) => `${cliente.tipoDocumento ?? ''} ${cliente.numeroDocumento ?? ''}`.trim(),
      nombre: (cliente) => this.nombre(cliente),
      telefono: (cliente) => cliente.telefono,
      correo: (cliente) => cliente.correo,
      direccion: (cliente) => cliente.direccion
    },
    'nombre'
  );

  private readonly textoObligatorio = [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)];
  readonly form = this.formBuilder.nonNullable.group({
    tipoDocumento: ['', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^\s*[A-Za-z0-9.-]{3,20}\s*$/)]],
    nombres: ['', this.textoObligatorio],
    apellidos: ['', this.textoObligatorio],
    fechaNacimiento: ['', [
      Validators.required,
      (control: AbstractControl<string>) => (control.value > this.hoy ? { fechaFutura: true } : null)
    ]],
    genero: [''],
    telefono: ['', [Validators.required, Validators.pattern(/^\s*\d{7,15}\s*$/)]],
    correo: ['', [Validators.email, Validators.maxLength(255)]],
    direccion: ['', Validators.maxLength(255)]
  });

  cargando = false;
  errorListado = '';
  clienteSelected: Cliente | null = null;
  modoFormulario: 'C' | 'E' = 'C';
  enviando = false;
  respuestaError = '';

  consulta: Consulta = 'mascotas';
  cargandoConsulta = false;
  errorConsulta = '';
  mascotas: Mascota[] = [];
  facturas: Factura[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
  }

  nombre(cliente: Cliente | null): string {
    return `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim();
  }

  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.clienteService.listarClientes().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (clientes) => this.tabla.items = clientes,
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar los clientes.')
    });
  }

  nuevoCliente(contenido: TemplateRef<unknown>): void {
    this.modoFormulario = 'C';
    this.clienteSelected = null;
    this.form.reset();
    this.abrir(contenido, 'clienteTitulo');
  }

  abrirEdicion(cliente: Cliente, contenido: TemplateRef<unknown>): void {
    this.modoFormulario = 'E';
    this.clienteSelected = cliente;
    this.form.reset({
      tipoDocumento: cliente.tipoDocumento?.trim() ?? '',
      numeroDocumento: cliente.numeroDocumento ?? '',
      nombres: cliente.nombres ?? '',
      apellidos: cliente.apellidos ?? '',
      fechaNacimiento: String(cliente.fechaNacimiento ?? '').slice(0, 10),
      genero: cliente.genero ?? '',
      telefono: cliente.telefono ?? '',
      correo: cliente.correo ?? '',
      direccion: cliente.direccion ?? ''
    });
    this.abrir(contenido, 'clienteTitulo');
  }

  /** Tipos ofrecidos, incluido el que ya tenga el cliente aunque no sea habitual. */
  get opcionesTipo(): string[] {
    const actual = this.clienteSelected?.tipoDocumento?.trim();
    return actual && !this.tiposDocumento.includes(actual) ? [actual, ...this.tiposDocumento] : this.tiposDocumento;
  }

  guardarCliente(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const datos: ClienteRq = {
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: valores.numeroDocumento.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      genero: valores.genero || null,
      telefono: valores.telefono.trim(),
      correo: valores.correo.trim() || null,
      direccion: valores.direccion.trim() || null
    };
    const id = this.clienteSelected?.id;
    if (this.modoFormulario === 'E' && id === undefined) {
      this.respuestaError = 'No se puede actualizar un cliente sin identificador.';
      return;
    }
    const solicitud: Observable<unknown> = id === undefined
      ? this.clienteService.crearCliente(datos)
      : this.clienteService.actualizarCliente(id, datos);
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: () => {
        this.enviando = false;
        this.modal?.close();
        this.listar();
        void Swal.fire('Operación exitosa', id === undefined
          ? 'El cliente fue creado correctamente.' : 'El cliente fue actualizado correctamente.', 'success');
      },
      error: (error: unknown) => {
        const mensaje = mensajeError(error, 'No fue posible guardar el cliente.');
        if (marcarErroresServidor(this.form, error)) {
          return;
        }
        // El único duplicado posible es el número de documento.
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.form.controls.numeroDocumento.setErrors({ servidor: mensaje });
          this.form.controls.numeroDocumento.markAsTouched();
        } else {
          this.respuestaError = mensaje;
        }
      }
    });
  }

  consultar(cliente: Cliente, consulta: Consulta, contenido: TemplateRef<unknown>): void {
    if (cliente.id === undefined) {
      return;
    }
    this.clienteSelected = cliente;
    this.consulta = consulta;
    this.mascotas = [];
    this.facturas = [];
    this.errorConsulta = '';
    this.cargandoConsulta = true;
    const modal = this.abrir(contenido, 'consultaTitulo');
    const manejarError = (error: unknown) => {
      // El backend puede responder 404 cuando el cliente no tiene registros.
      this.errorConsulta = error instanceof HttpErrorResponse && error.status === 404
        ? '' : mensajeError(error, 'No fue posible cargar la información.');
    };
    const opciones = <T>(origen: Observable<T>) => origen.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoConsulta = false)
    );
    const suscripcion = consulta === 'mascotas'
      ? opciones(this.clienteService.listarMascotas(cliente.id)).subscribe({ next: (datos) => this.mascotas = datos, error: manejarError })
      : opciones(this.clienteService.listarFacturas(cliente.id)).subscribe({ next: (datos) => this.facturas = datos, error: manejarError });
    modal.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => suscripcion.unsubscribe());
  }

  private abrir(contenido: TemplateRef<unknown>, titulo: string): NgbModalRef {
    this.respuestaError = '';
    this.modal = this.modalService.open(contenido, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: titulo
    });
    return this.modal;
  }
}
