import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Agenda } from './agenda'; // 

describe('AgendaComponent', () => {
    let component: Agenda;
    let fixture: ComponentFixture<Agenda>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Agenda], 
        }).compileComponents();

        fixture = TestBed.createComponent(Agenda);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
    });

    it('should have default consultas array', () => {
        expect(component.consultas).toBeDefined();
        expect(component.consultas.length).toBeGreaterThan(0);
    });

    it('trackByConsulta returns a string containing dia and hora', () => {
        const consulta = component.consultas[0];
        const key = component.trackByConsulta(0, consulta);
        expect(typeof key).toBe('string');
        expect(key).toContain(consulta.dia);
        expect(key).toContain(consulta.hora);
    });
});