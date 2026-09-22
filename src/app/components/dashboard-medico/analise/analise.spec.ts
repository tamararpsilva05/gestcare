import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Analise } from './analise';

describe('Analise', () => {
  let component: Analise;
  let fixture: ComponentFixture<Analise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Analise],
    }).compileComponents();

    fixture = TestBed.createComponent(Analise);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
