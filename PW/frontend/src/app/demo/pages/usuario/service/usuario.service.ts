import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = 'usuario';

  constructor(private backendService: BackendService) { }

  listar(): Observable<any[]> {
    // Según tu UsuarioApi.java, el endpoint es /listar-ordenado
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-ordenado");
  }

  guardar(usuario: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "guardar", usuario);
  }

  actualizar(usuario: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", usuario);
  }
}