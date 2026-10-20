import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service'; 
import { environment } from 'src/environments/environment';
import { Formula } from 'src/app/models/formula';

@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  
  private apiFormula = `formula-medica`;
  private apiCita = `cita`;

  constructor(private backendService: BackendService) { }

  listarFormulas(): Observable<Formula[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiFormula, "listar");
  }

  crearFormula(formula: Formula): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.apiFormula, "crear", formula);
  }

  actualizarFormula(formula: Formula): Observable<any> {
    return this.backendService.put(environment.apiUrlAuth, this.apiFormula, "actualizar", formula);
  }

  listarCitas(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiCita, "listar");
  }

  // --- AQUÍ ESTÁ EL CAMBIO DEL PASO 3 ---
  listarMedicamentos(): Observable<any[]> {
    // Le decimos que busque en la ruta de formula-medica, en el endpoint "medicamentos"
    return this.backendService.get(environment.apiUrlAuth, this.apiFormula, "medicamentos");
  }
}