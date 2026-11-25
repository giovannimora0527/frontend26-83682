import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Tipo «Dinero»: valores permitidos para dinero. */
export type Dinero = string | number;
/** Tipo «EstadoFactura»: valores permitidos para estado factura. */
export type EstadoFactura = 'PENDIENTE_PAGO' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';

/** Modelo de datos «OrigenFactura» que se intercambia con el backend. */
export interface OrigenFactura {
  /** Identificador único del registro. */
  id: number;
  /** Cita. */
  cita: number;
  /** Propietario. */
  propietario: string;
  /** Mascota. */
  mascota: string;
  /** Veterinario. */
  veterinario: string;
  /** Especialidad. */
  especialidad: string;
  /** Fórmulas confirmadas que despacho aún no procesa (no se puede facturar hasta entregarlas). */
  formulasSinDespachar?: number;
}
/** Modelo de datos «ImportesFactura» que se intercambia con el backend. */
export interface ImportesFactura { subtotal: Dinero; descuento: Dinero; iva: Dinero; otros: Dinero; total: Dinero }
/** Modelo de datos «PreviaFactura» que se intercambia con el backend. */
export interface PreviaFactura {
  /** Origen. */
  origen: OrigenFactura;
  /** Huella. */
  huella: string;
  /** Importes. */
  importes: ImportesFactura;
  /** Lineas. */
  lineas: { origen: { servicio: number | null; movimiento: number | null; nombre: string; cantidad: number; precio: Dinero };
    importes: ImportesFactura }[];
}
/** Modelo de datos «Factura» que se intercambia con el backend. */
export interface Factura {
  /** Identificador único del registro. */
  id: number; numero: string; atencion: number; cita: number; emitida: string; propietario: string; mascota: string;
  /** Veterinario. */
  veterinario: string; especialidad: string; subtotal: Dinero; descuento: Dinero; iva: Dinero; otros_impuestos: Dinero;
  /** Valor total. */
  total: Dinero; pagado: Dinero; saldo: Dinero; estado: EstadoFactura; responsable: string;
}
/** Modelo de datos «DetalleFactura» que se intercambia con el backend. */
export interface DetalleFactura {
  /** Factura. */
  factura: Factura;
  /** Lineas. */
  lineas: { id: number; servicio_id: number | null; concepto: string; cantidad: number; precio_unitario: Dinero;
    subtotal: Dinero; descuento: Dinero; iva: Dinero; otros_impuestos: Dinero; total: Dinero }[];
  /** Pagos. */
  pagos: { id: number; fecha: string; importe: Dinero; metodo: string; referencia: string | null; responsable: string; estado: string }[];
  /** Historial. */
  historial: { id: number; anterior: EstadoFactura | null; nuevo: EstadoFactura; fecha: string; motivo: string | null; responsable: string }[];
}

/** Servicio de facturacion: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({providedIn: 'root'})
export class FacturacionService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http=inject(HttpClient);
  /** URL base de la API del backend. */
  private readonly base=environment.apiUrlAuth+'/facturacion';

  /**
   * Lista facturacion mediante la API del backend.
   *
   * @param params parámetros de consulta.
   * @returns observable con la respuesta del backend.
   */
  listar(params: Record<string,string|number>) {
    return this.http.get<Factura[]>(this.base+'/facturas',{params});
  }
  /**
   * Lista los registros elegibles mediante la API del backend.
   *
   * @param pagina número de página.
   * @returns observable con la respuesta del backend.
   */
  elegibles(pagina: number) {
    return this.http.get<OrigenFactura[]>(this.base+'/atenciones',{params:{pagina}});
  }
  /**
   * Calcula la vista previa mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param descuento descuento.
   * @param motivo motivo indicado por el usuario.
   * @returns observable con la respuesta del backend.
   */
  previa(id: number, descuento: string, motivo: string) {
    return this.http.post<PreviaFactura>(this.base+'/atenciones/'+id+'/previa',{descuento,motivo});
  }
  /**
   * Emite facturacion mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param clave clave.
   * @param previa previa.
   * @param descuento descuento.
   * @param motivo motivo indicado por el usuario.
   * @returns observable con la respuesta del backend.
   */
  emitir(id: number, clave: string, previa: string, descuento: string, motivo: string) {
    return this.http.post<DetalleFactura>(this.base+'/atenciones/'+id+'/facturas',{clave,previa,descuento,motivo});
  }
  /**
   * Consulta el detalle mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  detalle(id: number) { return this.http.get<DetalleFactura>(this.base+'/facturas/'+id); }
  /**
   * Registra el pago de facturacion mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param pago pago.
   * @returns observable con la respuesta del backend.
   */
  pagar(id: number, pago: {clave: string; importe: string; saldoEsperado: Dinero; metodo: string; referencia: string}) {
    return this.http.post<DetalleFactura>(this.base+'/facturas/'+id+'/pagos',pago);
  }
  /**
   * Anula facturacion mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param motivo motivo indicado por el usuario.
   * @returns observable con la respuesta del backend.
   */
  anular(id: number, motivo: string) {
    return this.http.post<DetalleFactura>(this.base+'/facturas/'+id+'/anular',{motivo});
  }
  /**
   * Descarga el PDF el dato de la sesión.
   *
   * @param id identificador del registro.
   */
  pdf(id: number) { return this.http.get(this.base+'/facturas/'+id+'/pdf',{responseType:'blob'}); }
}
