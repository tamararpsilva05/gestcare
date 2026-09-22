import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGravida } from './dashboard-gravida';

describe('DashboardGravida', () => {
  let component: DashboardGravida;
  let fixture: ComponentFixture<DashboardGravida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGravida],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardGravida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
