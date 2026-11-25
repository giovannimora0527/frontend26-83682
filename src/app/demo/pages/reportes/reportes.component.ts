import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import { CeldaReporte, ColumnaReporte, ReportesService, ResultadoReporte } from '../../../services/reportes.service';

import { PaginadorComponent } from '../../../utils/paginador.component';
/** Catalogo. */
/**
 * Permisos que habilitan cada tipo de reporte (igual que en el backend, que es quien valida).
 *
 * @param tipo tipo de reporte.
 * @returns permisos aceptados.
 */
function permisosReporte(tipo: string): string[] {
  if (['FINANCIERO', 'FACTURAS', 'PAGOS', 'POR_MEDICO', 'POR_ESPECIALIDAD', 'CONCEPTOS'].includes(tipo)) return ['REPORTE_FINANCIERO'];
  if (['EXISTENCIAS', 'LOTES', 'MOVIMIENTOS'].includes(tipo)) return ['REPORTE_INVENTARIO'];
  if (tipo === 'DISPENSACIONES') return ['REPORTE_INVENTARIO', 'REPORTE_DESPACHO'];
  if (['CITAS', 'CITAS_OPERATIVAS'].includes(tipo)) return ['REPORTE_CITAS'];
  return ['REPORTE_MEDICO'];
}

const catalogo = [
  { id:'FINANCIERO', nombre:'Resumen financiero', grupo:'Financieros' },
  { id:'FACTURAS', nombre:'Facturas y saldos al cierre', grupo:'Financieros' },
  { id:'PAGOS', nombre:'Pagos recibidos', grupo:'Financieros' },
  { id:'POR_MEDICO', nombre:'Facturación por veterinario', grupo:'Financieros' },
  { id:'POR_ESPECIALIDAD', nombre:'Facturación por especialidad', grupo:'Financieros' },
  { id:'CONCEPTOS', nombre:'Facturación por servicio y medicamento', grupo:'Financieros' },
  { id:'EXISTENCIAS', nombre:'Existencias y valoración', grupo:'Inventario' },
  { id:'LOTES', nombre:'Inventario por lote', grupo:'Inventario' },
  { id:'MOVIMIENTOS', nombre:'Movimientos de inventario', grupo:'Inventario' },
  { id:'DISPENSACIONES', nombre:'Dispensaciones y reversiones', grupo:'Inventario' },
  { id:'CITAS', nombre:'Gestión médica de citas', grupo:'Gestión médica' },
  { id:'CONSULTAS', nombre:'Consultas por veterinario y especialidad', grupo:'Gestión médica' },
  { id:'ATENCIONES', nombre:'Atenciones finalizadas', grupo:'Gestión médica' },
  { id:'CITAS_OPERATIVAS', nombre:'Resumen operativo de citas', grupo:'Operativos' }
];

/** Pantalla «reportes» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector:'app-reportes',
  standalone:true,
  imports:[PaginadorComponent, FormsModule],
  templateUrl:'./reportes.component.html'
})
export class ReportesComponent {
  /** Ruta del recurso en la API del backend. */
  private readonly api=inject(ReportesService);
  /** Rol del usuario. */
  private readonly auth=inject(AuthService);
  /** Catalogo. */
  readonly catalogo=catalogo.filter(r=>this.auth.tieneAlguno(...permisosReporte(r.id)));
  /** Lista de grupos. */
  readonly grupos=[...new Set(this.catalogo.map(r=>r.grupo))];
  /** Tipo de registro. */
  tipo=this.catalogo[0].id;
  /** Criterio de filtrado: filtros. */
  filtros={desde:'',hasta:'',medico:'',especialidad:'',medicamento:'',lote:'',mascota:'',propietario:'',estado:'',agrupacion:'DIA'};
  /** Resultado. */
  resultado:ResultadoReporte|null=null;
  /** Mensaje mostrado al usuario (error). */
  error='';
  /** Indica si ocupado. */
  ocupado=false;
  /** Consulta. */
  private consulta:{tipo:string;parametros:Record<string,string>}|null=null;

  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() { this.limpiar(); }

  /**
   * Indica si el reporte seleccionado es de inventario.
   *
   * @returns es inventario.
   */
  get esInventario() { return this.catalogo.find(r=>r.id===this.tipo)?.grupo==='Inventario'; }
  /**
   * Existencia histórica.
   *
   * @returns existencia histórica.
   */
  get existenciaHistorica() { return this.tipo==='EXISTENCIAS' && !!(this.filtros.desde || this.filtros.hasta); }

  /**
   * Estados.
   *
   * @returns estados.
   */
  get estados() {
    if(this.tipo==='FACTURAS') return ['PENDIENTE_PAGO','PAGO_PARCIAL','PAGADA','ANULADA'];
    if(this.tipo==='EXISTENCIAS' && !this.existenciaHistorica) return ['agotado','minimo','vencido','proximo'];
    if(this.tipo==='MOVIMIENTOS') return ['ENTRADA','SALIDA','AJUSTE'];
    return ['CITAS','CITAS_OPERATIVAS','CONSULTAS','ATENCIONES'].includes(this.tipo)
      ? ['pendiente','confirmada','cancelada','atendida','finalizada'] : [];
  }

  /** Limpia los datos de la pantalla. */
  limpiar() {
    const partes=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'})
      .formatToParts(new Date());
    const hoy=['year','month','day'].map(t=>partes.find(p=>p.type===t)?.value).join('-');
    this.filtros={desde:hoy.slice(0,7)+'-01',hasta:hoy,medico:'',especialidad:'',medicamento:'',lote:'',
      mascota:'',propietario:'',estado:'',agrupacion:'DIA'};
    if(['EXISTENCIAS','LOTES'].includes(this.tipo)) {
      this.filtros.desde='';
      this.filtros.hasta='';
    }
    this.resultado=null;
    this.consulta=null;
    this.error='';
  }

  /** Consulta los datos de la pantalla. */
  consultar() {
    const { agrupacion,...filtros }=this.filtros;
    const parametros=Object.fromEntries(Object.entries(filtros).filter(([,v])=>v!==null && v!=='' && v!==undefined));
    if(this.tipo==='FINANCIERO') parametros['agrupacion']=agrupacion;
    if(this.existenciaHistorica) delete parametros['estado'];
    const consulta={tipo:this.tipo,parametros};
    this.resultado=null;
    this.consulta=null;
    void this.operar(async()=>{
      this.resultado=await firstValueFrom(this.api.consultar(consulta.tipo,consulta.parametros));
      this.consulta=consulta;
    });
  }

  /**
   * Total de páginas del reporte (el servidor devuelve 50 registros por página).
   *
   * @param registros total de registros del reporte.
   * @returns número de páginas (mínimo 1).
   */
  totalPaginasReporte(registros:number): number { return Math.max(1, Math.ceil(registros / 50)); }

  /**
   * Consulta otra página del reporte.
   *
   * @param pagina número de página (desde 0).
   */
  cambiarPagina(pagina:number) {
    const consulta=this.consulta;
    if(!consulta) return;
    void this.operar(async()=>{
      this.resultado=await firstValueFrom(this.api.consultar(consulta.tipo,{...consulta.parametros,pagina}));
    });
  }

  /**
   * Exporta los datos de la pantalla.
   *
   * @param formato formato.
   */
  exportar(formato:'pdf'|'excel') {
    const consulta=this.consulta;
    if(!consulta) return;
    void this.operar(async()=>{
      const blob=await firstValueFrom(this.api.descargar(consulta.tipo,formato,consulta.parametros));
      descargarClinica(blob,'reporte-'+consulta.tipo.toLowerCase()+'.'+(formato==='excel'?'xlsx':'pdf'));
    });
  }

  /**
   * Entradas.
   *
   * @param mapa mapa.
   */
  entradas(mapa:Record<string,CeldaReporte>) { return Object.entries(mapa); }

  /**
   * Etiqueta.
   *
   * @param clave clave.
   */
  etiqueta(clave:string) {
    return this.resultado?.columnas.find(c=>c.clave===clave)?.titulo ?? clave.replaceAll('_',' ');
  }

  /**
   * Valor.
   *
   * @param celda celda.
   * @param col col.
   */
  valor(celda:CeldaReporte|undefined,col?:ColumnaReporte) {
    if(celda===null || celda===undefined) return '—';
    if(col?.formato==='COP') return 'COP '+String(celda).replace('.',',');
    if(col?.formato==='FECHAHORA') return String(celda).replace('T',' ').slice(0,19);
    return String(celda);
  }

  /**
   * Total.
   *
   * @param clave clave.
   * @param celda celda.
   */
  total(clave:string,celda:CeldaReporte) {
    return this.valor(celda,this.resultado?.columnas.find(c=>c.clave===clave));
  }

  /**
   * Ejecuta la operación los datos de la pantalla.
   *
   * @param accion acción.
   */
  private async operar(accion:()=>Promise<void>) {
    if(this.ocupado) return;
    this.ocupado=true;
    this.error='';
    try { await accion(); }
    catch(e) { this.error=await mensajeClinica(e as { error?:unknown }); }
    finally { this.ocupado=false; }
  }
}
