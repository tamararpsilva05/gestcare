import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcarConsulta } from './marcar-consulta';

describe('MarcarConsulta', () => {
  let component: MarcarConsulta;
  let fixture: ComponentFixture<MarcarConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcarConsulta],
    }).compileComponents();

    fixture = TestBed.createComponent(MarcarConsulta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
