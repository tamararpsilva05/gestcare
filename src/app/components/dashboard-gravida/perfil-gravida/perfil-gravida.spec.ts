import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilGravida } from './perfil-gravida';

describe('PerfilGravida', () => {
  let component: PerfilGravida;
  let fixture: ComponentFixture<PerfilGravida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilGravida],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilGravida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
