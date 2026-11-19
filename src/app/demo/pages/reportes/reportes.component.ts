import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import { CeldaReporte, ColumnaReporte, ReportesService, ResultadoReporte } from '../../../services/reportes.service';

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

@Component({
  selector:'app-reportes',
  standalone:true,
  imports:[FormsModule],
  templateUrl:'./reportes.component.html'
})
export class ReportesComponent {
  private readonly api=inject(ReportesService);
  private readonly rol=inject(AuthService).obtenerPerfil()?.trim().toUpperCase();
  readonly catalogo=this.rol==='ADMINISTRADOR'||this.rol==='ADMIN'
    ? catalogo : catalogo.filter(r=>r.id==='CITAS_OPERATIVAS');
  readonly grupos=[...new Set(this.catalogo.map(r=>r.grupo))];
  tipo=this.catalogo[0].id;
  filtros={desde:'',hasta:'',medico:'',especialidad:'',medicamento:'',lote:'',mascota:'',propietario:'',estado:'',agrupacion:'DIA'};
  resultado:ResultadoReporte|null=null;
  error='';
  ocupado=false;
  private consulta:{tipo:string;parametros:Record<string,string>}|null=null;

  constructor() { this.limpiar(); }

  get esInventario() { return this.catalogo.find(r=>r.id===this.tipo)?.grupo==='Inventario'; }
  get estados() {
    if(this.tipo==='FACTURAS') return ['PENDIENTE_PAGO','PAGO_PARCIAL','PAGADA','ANULADA'];
    if(this.tipo==='EXISTENCIAS') return ['agotado','minimo','vencido','proximo'];
    if(this.tipo==='MOVIMIENTOS') return ['ENTRADA','SALIDA','AJUSTE'];
    return ['CITAS','CITAS_OPERATIVAS','CONSULTAS','ATENCIONES'].includes(this.tipo)
      ? ['pendiente','confirmada','cancelada','atendida','finalizada'] : [];
  }

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

  consultar() {
    const { agrupacion,...filtros }=this.filtros;
    const parametros=Object.fromEntries(Object.entries(filtros).filter(([,v])=>v!==null && v!=='' && v!==undefined));
    if(this.tipo==='FINANCIERO') parametros['agrupacion']=agrupacion;
    const consulta={tipo:this.tipo,parametros};
    this.resultado=null;
    this.consulta=null;
    void this.operar(async()=>{
      this.resultado=await firstValueFrom(this.api.consultar(consulta.tipo,consulta.parametros));
      this.consulta=consulta;
    });
  }

  cambiarPagina(pagina:number) {
    const consulta=this.consulta;
    if(!consulta) return;
    void this.operar(async()=>{
      this.resultado=await firstValueFrom(this.api.consultar(consulta.tipo,{...consulta.parametros,pagina}));
    });
  }

  exportar(formato:'pdf'|'excel') {
    const consulta=this.consulta;
    if(!consulta) return;
    void this.operar(async()=>{
      const blob=await firstValueFrom(this.api.descargar(consulta.tipo,formato,consulta.parametros));
      descargarClinica(blob,'reporte-'+consulta.tipo.toLowerCase()+'.'+(formato==='excel'?'xlsx':'pdf'));
    });
  }

  entradas(mapa:Record<string,CeldaReporte>) { return Object.entries(mapa); }

  etiqueta(clave:string) {
    return this.resultado?.columnas.find(c=>c.clave===clave)?.titulo ?? clave.replaceAll('_',' ');
  }

  valor(celda:CeldaReporte|undefined,col?:ColumnaReporte) {
    if(celda===null || celda===undefined) return '—';
    if(col?.formato==='COP') return 'COP '+String(celda).replace('.',',');
    if(col?.formato==='FECHAHORA') return String(celda).replace('T',' ').slice(0,19);
    return String(celda);
  }

  total(clave:string,celda:CeldaReporte) {
    return this.valor(celda,this.resultado?.columnas.find(c=>c.clave===clave));
  }

  private async operar(accion:()=>Promise<void>) {
    if(this.ocupado) return;
    this.ocupado=true;
    this.error='';
    try { await accion(); }
    catch(e) { this.error=await mensajeClinica(e as { error?:unknown }); }
    finally { this.ocupado=false; }
  }
}
