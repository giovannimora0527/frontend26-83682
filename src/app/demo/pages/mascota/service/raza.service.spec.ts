import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RazaService } from './raza.service';

describe('RazaService', () => {
  let service: RazaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(RazaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
