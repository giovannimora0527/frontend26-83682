import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FormulaService } from './formula.service';

describe('FormulaService', () => {
  let service: FormulaService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FormulaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
