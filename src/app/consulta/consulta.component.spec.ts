import { CdkAccordionModule } from '@angular/cdk/accordion';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, getTestBed, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import paradas_cercanas from '../../assets/json/cercanas.json';
import tiempoRealLineaYParada from '../../assets/json/tiempoRealLineaYParada.json';
import tiempoRealParada from '../../assets/json/tiempoRealParada.json';
import paradasLineaBus from '../../assets/json/paradasLineaBus.json';
import horarios from '../../assets/json/horarios.json';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ConsultaComponent } from './consulta.component';

describe('ConsultaComponent', () => {
  let component: ConsultaComponent;
  let fixture: ComponentFixture<ConsultaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsultaComponent ],
      providers: [HttpClient, HttpHandler],
      imports: [FormsModule, CdkAccordionModule, HttpClientTestingModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by district Eixample and be greater than 0', () => {

    let httpMock = paradas_cercanas;
    let stops = httpMock[0].features.filter((parada: any) => {
      let checkPoints = component.arePointsNear(2.159707, parada.geometry.coordinates[0],
      41.406218 , parada.geometry.coordinates[1]);
      return checkPoints;
    });
    let distrito = stops.filter((stop: any) => {
      return stop.properties.NOM_DISTRICTE === 'Eixample';
    });
    expect(distrito.length).toBeGreaterThan(0);
  });

  it('should show all stops', () => {
    let paradas = paradas_cercanas[0].features;
    expect(paradas.length).toBeGreaterThan(2000);
  });

  it('should get data one stop', () => {
    let paradas = paradas_cercanas[0].features;
    let parada = paradas.filter((parada) => {
      return parada.properties.NOM_PARADA === 'Montalegre - Valldonzella';
    });
    expect(parada.length).toEqual(1);
    expect(parada[0].properties.ADRECA).toEqual('Montalegre, 10');
  });

  it('should get arrive time in minutes and seconds', () => {
    let parada = tiempoRealLineaYParada.data.ibus[0];
    expect(parada['t-in-s']).toEqual(100);
    expect(parada['t-in-min']).toEqual(1);
  });

  it('should get arrive time and number line', () => {
    let parada = tiempoRealParada.data.ibus;
    expect(parada.length).toEqual(6);
    expect(parada[0].line).toEqual('H2');
    expect(parada[0]['t-in-min']).toEqual(2);
  });

  it('should get number stops by line and check name first stop and district name', () => {
    let paradas = paradasLineaBus.features;
    expect(paradas.length).toEqual(54);
    expect(paradas[0].properties.NOM_PARADA).toEqual('Mercat Mare de Déu de Montserrat');
    expect(paradas[0].properties.NOM_DISTRICTE).toEqual('Nou Barris');
  });

  it('should get passing time bus by line', () => {
    let horariosPorParadaYLinea = horarios.features;
    expect(horariosPorParadaYLinea.length).toEqual(9);
    expect(horariosPorParadaYLinea[0].properties.LITERAL).toEqual('07:45 - 08:16 - 08:46 - 09:18 - 09:50 - 10:22 - 10:55 - 11:28');
  });
});
