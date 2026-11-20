import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { hoyBogota } from '../../../services/agenda.service';
import { DespachoComponent } from './despacho.component';

describe('DespachoComponent', () => {
  it('identifica vencimientos vigentes dentro de los próximos 30 días', () => {
    TestBed.configureTestingModule({
      imports: [DespachoComponent],
      providers: [provideHttpClient()]
    });
    const componente = TestBed.createComponent(DespachoComponent).componentInstance;
    const hoy = hoyBogota();
    const fecha = (dias: number) => {
      const dia = new Date(hoy + 'T00:00:00Z');
      dia.setUTCDate(dia.getUTCDate() + dias);
      return dia.toISOString().slice(0, 10);
    };
    expect(componente.proximoAVencer(null)).toBeFalse();
    expect(componente.proximoAVencer(fecha(-1))).toBeFalse();
    expect(componente.proximoAVencer(hoy)).toBeTrue();
    expect(componente.proximoAVencer(fecha(30))).toBeTrue();
    expect(componente.proximoAVencer(fecha(31))).toBeFalse();
  });
});
