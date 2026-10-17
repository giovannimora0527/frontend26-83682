import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MascotaService } from './mascota.service';

describe('MascotaService', () => {
  let service: MascotaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(MascotaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
