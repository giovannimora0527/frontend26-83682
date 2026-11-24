import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CargaInventario } from 'src/app/models/carga-inventario';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CargaInventarioService {
  private api = 'inventario/carga';

  constructor(private readonly backendService: BackendService) { }

  previsualizar(archivo: File): Observable<CargaInventario> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.backendService.postArchivo(`${this.api}/previsualizar`, formData);
  }

  obtener(cargaId: number): Observable<CargaInventario> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(cargaId));
  }

  confirmar(cargaId: number): Observable<RespuestaApi<CargaInventario>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${cargaId}/confirmar`, null);
  }

  descartar(cargaId: number): Observable<RespuestaApi<CargaInventario>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${cargaId}/descartar`, null);
  }

  historial({ desde, hasta }: RangoFechas): Observable<CargaInventario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'historial', construirParams({ desde, hasta }));
  }
}
