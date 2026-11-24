import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Perfil } from 'src/app/models/perfil';
import { Usuario, UsuarioRq } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = 'usuario';

  constructor(private readonly backendService: BackendService) { }

  listarUsuarios(): Observable<Usuario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-ordenado');
  }

  listarPerfiles(): Observable<Perfil[]> {
    return this.backendService.get(environment.apiUrlAuth, 'perfil', 'listar');
  }

  crearUsuario(usuario: UsuarioRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', usuario);
  }

  actualizarUsuario(usuario: UsuarioRq & { id: number }): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'actualizar', usuario);
  }

  cambiarEstado(id: number, activo: boolean): Observable<unknown> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
