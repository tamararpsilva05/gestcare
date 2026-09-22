import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcarExame} from './marcar-exames';

describe('MarcarExames', () => {
  let component: MarcarExame;
  let fixture: ComponentFixture<MarcarExame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcarExame],
    }).compileComponents();

    fixture = TestBed.createComponent(MarcarExame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
