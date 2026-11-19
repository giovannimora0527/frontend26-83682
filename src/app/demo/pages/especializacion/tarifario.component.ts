import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { hoyBogota } from '../../../services/agenda.service';
import { ClinicaService, Especialidad, mensajeClinica, ServicioClinico, TarifaClinica } from '../../../services/clinica.service';

@Component({
  selector: 'app-tarifario',
  imports: [CommonModule, FormsModule],
  templateUrl: './tarifario.component.html'
})
export class TarifarioComponent implements OnInit {
  private readonly api = inject(ClinicaService);
  especialidades: Especialidad[] = [];
  especialidad: Especialidad | null = null;
  edicion: Especialidad | null = null;
  servicios: ServicioClinico[] = [];
  servicio: ServicioClinico | null = null;
  historial: TarifaClinica[] = [];
  tarifa: TarifaClinica | null = null;
  nombreServicio = '';
  error = '';
  aviso = '';
  ocupado = false;

  ngOnInit() { this.cargar(); }
  cargar() { this.operar(this.api.especialidades(), datos => { this.especialidades = datos; }); }
  editar(e?: Especialidad) { this.edicion = e ? { ...e } : { codigo: '', nombre: '', descripcion: null, activo: true }; }
  guardar(e: Especialidad) {
    this.operar(this.api.guardarEspecialidad(e), actual => {
      this.edicion = null;
      this.aviso = 'Especialidad guardada.';
      if (this.especialidad?.id === actual.id) this.especialidad = actual;
      this.cargar();
    });
  }

  ver(e: Especialidad) {
    this.especialidad = e;
    this.servicio = null;
    this.tarifa = null;
    this.historial = [];
    this.servicios = [];
    this.operar(this.api.servicios(e.id!), servicios => { this.servicios = servicios; });
  }

  agregarServicio(e: Especialidad) {
    this.operar(this.api.agregarServicio(e.id!, this.nombreServicio), s => {
      this.nombreServicio = '';
      this.servicios = [...this.servicios, s];
      this.verTarifas(s);
    });
  }

  verTarifas(s: ServicioClinico) {
    this.servicio = s;
    this.tarifa = null;
    this.operar(this.api.historial(s.id), tarifas => { this.historial = tarifas; });
  }

  nuevaTarifa() { this.tarifa = { valor: 0, iva: 0, impuesto: 0, desde: hoyBogota(), hasta: null }; }

  registrar(s: ServicioClinico, datos: TarifaClinica) {
    if (!confirm('¿Registrar esta nueva vigencia de tarifa?')) return;
    this.operar(this.api.nuevaTarifa(s.id, datos), () => {
      this.aviso = 'Vigencia registrada. Se conservó el historial.';
      this.verTarifas(s);
    });
  }

  private operar<T>(req: Observable<T>, ok: (dato: T) => void) {
    this.error = '';
    this.ocupado = true;
    req.pipe(finalize(() => { this.ocupado = false; })).subscribe({ next: ok, error: async e => { this.error = await mensajeClinica(e); } });
  }
}
