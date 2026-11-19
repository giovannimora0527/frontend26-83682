import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Especialidad { id?: number; codigo: string; nombre: string; descripcion: string | null; activo: boolean; }
export interface ServicioClinico { id: number; especialidadId: number; nombre: string; }
export interface TarifaClinica {
  id?: number; valor: number; iva: number; impuesto: number; desde: string; hasta: string | null; usuarioId?: number; fecha?: string;
}
export interface DatosClinicos {
  version: number; motivo: string | null; sintomas: string | null; diagnostico: string | null;
  observaciones: string | null; recomendaciones: string | null;
}
export interface LineaFormula {
  medicamentoId: number | null; nombre?: string; dosis: string; frecuencia: string; duracion: string;
  cantidad: number; via: string; indicaciones: string | null; precioEstimado?: number;
}
export interface FormulaClinica {
  id: number; citaId: number; paciente: string; estado: 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';
  revision: number; creada: string; medicamentos: LineaFormula[];
}
export interface AtencionClinica {
  cita: { citaId: number; medico: string; mascota: string; propietario: string; estado: string; inicio: string };
  atencion: (DatosClinicos & { id: number; historiaId: number; especialidad: string; finalizada: string | null }) | null;
  antecedentes: { fecha: string | null; medico: string; descripcion: string }[];
  servicios: { servicioId: number; nombre: string; cantidad: number; valor: number; iva: number; impuesto: number }[];
  catalogo: { servicio: ServicioClinico; tarifa: TarifaClinica | null }[];
  formulas: FormulaClinica[];
}

@Injectable({ providedIn: 'root' })
export class ClinicaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrlAuth;
  private readonly admin = this.base + '/tarifario';
  private readonly clinica = this.base + '/atencion';

  especialidades() { return this.http.get<Especialidad[]>(this.admin + '/especialidades'); }
  guardarEspecialidad(datos: Especialidad) {
    const url = this.admin + '/especialidades';
    return datos.id ? this.http.put<Especialidad>(url + '/' + datos.id, datos) : this.http.post<Especialidad>(url, datos);
  }

  servicios(id: number) { return this.http.get<ServicioClinico[]>(this.admin + '/especialidades/' + id + '/servicios'); }
  agregarServicio(id: number, nombre: string) {
    return this.http.post<ServicioClinico>(this.admin + '/especialidades/' + id + '/servicios', { nombre });
  }
  historial(id: number) { return this.http.get<TarifaClinica[]>(this.admin + '/servicios/' + id + '/tarifas'); }
  nuevaTarifa(id: number, tarifa: TarifaClinica) {
    return this.http.post<TarifaClinica>(this.admin + '/servicios/' + id + '/tarifas', { ...tarifa, hasta: tarifa.hasta || null });
  }

  consultar(id: number) { return this.http.get<AtencionClinica>(this.cita(id)); }
  abrir(id: number) { return this.http.post<AtencionClinica>(this.cita(id) + '/abrir', null); }
  guardar(id: number, datos: DatosClinicos, servicios: { servicioId: number; cantidad: number }[]) {
    return this.http.put<AtencionClinica>(this.cita(id), { ...datos, servicios });
  }
  finalizar(id: number, version: number) {
    return this.http.post<AtencionClinica>(this.cita(id) + '/finalizar', null, { params: { version } });
  }
  prefactura(id: number) { return this.http.get(this.cita(id) + '/prefactura', { responseType: 'blob' }); }

  citasPropias() {
    return this.http.get<{ id: number; mascotaId: number; fechaHora: string; estado: string }[]>(this.base + '/cita/listar');
  }
  formulas() { return this.http.get<FormulaClinica[]>(this.clinica + '/formulas'); }
  guardarFormula(cita: number, formula: FormulaClinica | null, medicamentos: LineaFormula[]) {
    const url = this.cita(cita) + '/formulas';
    const dto = { revision: formula?.revision ?? null, medicamentos };
    return formula ? this.http.put<FormulaClinica>(url + '/' + formula.id, dto) : this.http.post<FormulaClinica>(url, dto);
  }
  resolverFormula(formula: FormulaClinica, accion: 'confirmar' | 'anular') {
    return this.http.post<FormulaClinica>(this.clinica + '/formulas/' + formula.id + '/' + accion, null,
      { params: { revision: formula.revision } });
  }
  formulaPdf(id: number, historica = false) {
    return this.http.get(this.clinica + '/formulas/' + (historica ? 'legadas/' : '') + id + '/pdf', { responseType: 'blob' });
  }

  private cita(id: number) { return this.clinica + '/citas/' + id; }
}

export function descargarClinica(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function mensajeClinica(err: { error?: unknown }) {
  try {
    const error = err.error instanceof Blob ? JSON.parse(await err.error.text()) : err.error;
    return (error as { mensaje?: string; detail?: string })?.mensaje
      ?? (error as { detail?: string })?.detail ?? 'No fue posible completar la operación.';
  } catch { return 'No fue posible completar la operación.'; }
}
