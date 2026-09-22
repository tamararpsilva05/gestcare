
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineComponent } from './timeline'; 
import { RouterTestingModule } from '@angular/router/testing';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      
      imports: [
        TimelineComponent, 
        RouterTestingModule 
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    
    expect(component).toBeTruthy();
  });

  it('deve ter a semana 12 por defeito', () => {
    
    expect(component.semanaAtual).toBe(12);
  });
});