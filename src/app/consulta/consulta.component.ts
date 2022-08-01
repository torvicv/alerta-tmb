import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Bus } from '../models/Bus';
import { Parada } from '../models/parada';
import { TiempoReal } from '../models/TiempoReal';
import { latLng, marker, tileLayer, Map } from 'leaflet';
import { ConsultaService } from '../services/consulta.service';

import "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { Horario } from '../models/horario';
import { LoaderService } from '../services/loader.service';
declare let L: any;

@Component({
  selector: 'app-consulta',
  templateUrl: './consulta.component.html',
  styleUrls: ['./consulta.component.css']
})
export class ConsultaComponent implements OnInit {

  /**
   * Listener para todo el documento, que cuando haga click en cualquier parte, en este
   * caso si el evento contiene la clase '.ver', ejecutará el código.
   * @param event , de tipo any
   */
  @HostListener('window:click', ['$event'])
  onClick(event: any) {
    if (event.target.classList.contains('ver')) {
      let id = event.target.hash;
      let selector = document.querySelector(id);
      if (selector)
        selector.classList.add('focus');
      setTimeout(function() {
        selector.classList.remove('focus');
      }, 4000);
    } else if (event.target.classList.contains('map2') ||
      event.target.classList.contains('leaflet-marker-icon')) {
      event.preventDefault();
    }
  }

  // titulo de la consulta
  queryTitle!: string;

  // identificadores tmb
  app_id:string = '';
  app_key:string = '';

  submitted!: boolean;
  tiempoRealParada!: boolean;
  tiempoRealLineaYParada!: boolean;
  recorridoLinea!: boolean;
  paradasLineaBus!: boolean;
  paradasBus!: boolean;
  /*horariosBus!: boolean;
  horarioBusParada!: boolean;*/
  horasPasoHorarioLineaBus!: boolean;
  paradasCercanas!: boolean;
  paradasBusDistrito!: boolean;
  road!: boolean;
  checkAllStopBus!: boolean;

  // propiedades mapa
  options = {};
  dataMap: any[] = [];
  layers: any[] = [];
  options2 = {};
  layers2: any[] = [];
  dataSmallMap: any[] = [];
  layerSmallMap: any[] = [];
  names: any[] = [];
  namesOptions: any[] = [];

  distritos!: any[];
  data: any = [];
  error!: string;
  route: any[] = [];
  paradas: Parada[] = [];
  horario!: Horario | null;
  lines: any = [];
  tiempoReal: TiempoReal[] = [];
  buses: Bus[] = [];
  paradas1km: Parada[] = [];
  district!: string;

  constructor(private http: HttpClient, private elementRef: ElementRef,
    private service: ConsultaService, public loaderService: LoaderService) {
    this.submitted = false;
    this.tiempoRealParada = false;
    this.tiempoRealLineaYParada = false;
    this.recorridoLinea = false;
    this.paradasLineaBus = false;
    this.paradasBus = false;
    /*this.horariosBus = false;
    this.horarioBusParada = false;*/
    this.horasPasoHorarioLineaBus = false;
    this.paradasCercanas = false;
    this.paradasBusDistrito = false;
    this.road = false;
    this.checkAllStopBus = false;
    this.error = '';
   }

  ngOnInit(): void {
    // consigue todas las paradas para asignarlo al select de las paradas.
    this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key).pipe(
      map(response => JSON.stringify(response)),
      map(response => JSON.parse(response)),
      map(response => response.features),
    ).subscribe(x => {
      let distritos: any[] = [];
      x.map((resp: any) => {
        distritos.push(resp.properties.NOM_DISTRICTE);

        this.paradas.push(new Parada(resp.properties.NOM_PARADA, resp.properties.CODI_PARADA.toString()));
      });
      this.distritos = [...new Set(distritos)];
    });
  }

  /**
   * Al enviar el formulario, recibimos el valor del radio y asignamos el boolean
   * correspondiente a true.
   * @param value , tipo string, valor que nos llega del formulario.
   */
  onSubmit(value: string) {
    this.lines = [];
    if (value.length > 0) {
      this.submitted = true;
      switch(value) {
        case 'p':
          this.tiempoRealParada = true;
          break;
        case 'lYP':
          this.tiempoRealLineaYParada = true;
          break;
        case 'r':
          this.recorridoLinea = true;
          break;
        case 'pLB':
          this.paradasLineaBus = true;
          break;
        case 'pB':
          this.paradasBus = true;
          break;
        case 'pBD':
          this.paradasBusDistrito = true;
          break;
        /*case 'hB':
          this.horariosBus = true;
          break;
        case 'hBP':
          this.horarioBusParada = true;
          break;*/
        case 'hPHLB':
          this.horasPasoHorarioLineaBus = true;
          break;
        case 'pC':
          this.paradasCercanas = true;
          break;
        default:
          this.error = 'El valor seleccionado no es válido';
      }
    } else {
      this.submitted = false;
    }
  }

  /**
   * Consigue y asigna los datos de la consulta que elijamos.
   * @param data , tipo any, datos como línea y parada.
   */
  onShowData(data: any) {
    console.log(data);
    this.tiempoReal = [];
    if (this.tiempoRealLineaYParada) {
      // get next bus coming by bus line and bus stop.
      this.http.get('https://api.tmb.cat/v1/ibus/lines/'+data.linea+'/stops/'+data.parada+'?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe((bus) => {
        this.queryTitle = 'Tiempo Real por Línea y Parada';
        this.tiempoReal.push(new TiempoReal(data.linea, bus.data.ibus[0]['text-ca'], bus.data.ibus[0]['t-in-s'], bus.data.ibus[0]['t-in-min']));
      });
    } else if (this.tiempoRealParada) {
      // all buses at bus stop
      this.http.get('https://api.tmb.cat/v1/ibus/stops/'+data.parada+'?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe((bus) => {
        this.queryTitle = 'Tiempo real por Parada';
        bus.data.ibus.map((b: any) => {
          this.tiempoReal.push(new TiempoReal(b.line, b['text-ca'], b['t-in-s'], b['t-in-min']));
        });
      });
    } else if (this.recorridoLinea) {
      // get all bus stops by bus line.
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe(value => this.featuresMap(value, false));
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/recs?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.geometryMap.bind(this),
        error: () => alert('No tenemos datos de esa línea!!!')
      });
    } else if (this.paradasLineaBus) {
      this.queryTitle = 'Paradas por Línea';
      // get all bus stops by bus line.
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.featuresMap.bind(this),
        error: () => alert('No tenemos datos de esa línea!!!')
      });
    } else if (this.paradasBus) {
      this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.allStopBus.bind(this),
        error: () => alert('No tenemos datos de esa parada!!!')
      });
    } else if (this.paradasBusDistrito) {
      if (data.distrito.length > 0) {
        this.district = data.distrito;
      }
      this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.allStopBusDristrict.bind(this),
        error: () => alert('No tenemos datos de esa línea!!!')
      });
    /*} else if (this.horariosBus) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/horaris?app_id='+this.app_id+'&app_key='+this.app_key)
      .subscribe(bus => console.log(bus));
    } else if (this.horarioBusParada) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades/'+data.parada+'/horaris?app_id='+this.app_id+'&app_key='+this.app_key)
      .subscribe(bus => console.log(bus));*/
    } else if (this.horasPasoHorarioLineaBus) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades/'+data.parada+'/horespas?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.horarios.bind(this),
        error: () => alert('No tenemos datos de esa línea!!!')
      });
    } else if (this.paradasCercanas) {
      this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).toPromise()
      .then((paradas) => {
        this.queryTitle = 'Paradas cercanas';
        let stops = paradas.features.filter((parada: any) => {
          let checkPoints = this.arePointsNear(data.longitud, parada.geometry.coordinates[0], data.latitud,
            parada.geometry.coordinates[1]);
          return checkPoints;
        });
        let contador = 0;
        stops.map((stop: any) => {
          let stops = [];
          this.dataMap.push(
            marker([stop.geometry.coordinates[1], stop.geometry.coordinates[0]])
              .bindPopup('Parada: '+stop.properties.NOM_PARADA+'<br/>Distrito: '+stop.properties.NOM_DISTRICTE+'<br/>Dirección: '+stop.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+stop.properties.CODI_PARADA+'">Ver</a>')
          );
          let dataSmallMap = {latitud: stop.geometry.coordinates[1],longitud: stop.geometry.coordinates[0]}
          let layerSmallMap = marker([stop.geometry.coordinates[1], stop.geometry.coordinates[0]]);

          this.dataSmallMap.push(dataSmallMap);
          this.layerSmallMap.push(layerSmallMap);
          this.names.push(`layer`+contador);
          this.namesOptions.push(`option`+contador);
          stops.push(stop);
        });
        return stops;
      }).then((stops: any) => {
        let stopsLines = '';
        stops.map((stop: any) => {
          this.http.get('https://api.tmb.cat/v1/ibus/stops/'+stop.properties.CODI_PARADA+'?app_id='+this.app_id+'&app_key='+this.app_key)
          .pipe(
            map(response => JSON.stringify(response)),
            map(response => JSON.parse(response))
          ).subscribe((bus) => {
            stopsLines = '';
            bus.data.ibus.map((b: any) => {
              stopsLines += b.line + ', ';
            });
            stopsLines = stopsLines.replace(/,\s$/, '.');
            // console.log(stopsLines);
            this.paradas1km.push(new Parada(stop.properties.NOM_PARADA, stop.properties.CODI_PARADA,
              stop.properties.ADRECA, stop.properties.NOM_DISTRICTE, stopsLines));
          });
        });
        for (let i = 0; i < this.dataSmallMap.length; i++) {
          // this.showSmallMap(this.dataSmallMap[i], this.layerSmallMap[i], i);
          this.namesOptions[i] = this.service.showSmallMap(this.dataSmallMap[i], this.layerSmallMap[i])[0];
          this.names[i] = this.service.showSmallMap(this.dataSmallMap[i], this.layerSmallMap[i])[1];
        }
      });
      this.showMap(data);
    }
  }

  /**
   * Muestra el mapa grande, donde están todas las paradas.
   * @param data , tipo any, datos como la latitud y la longitud.
   */
  private showMap(data: any) {
    let dataMapOptions: any = {latitud: data.latitud, longitud: data.longitud};
    this.optionsAndLayers(dataMapOptions, 12);
    this.layers = this.dataMap;
  }

  /**
   * Guarda en una variable las lineas que pasan por la parada.
   * @param event , tipo any, el código de la parada.
   */
  setLine(event: any) {
    this.lines = [];
    this.http.get('https://api.tmb.cat/v1/ibus/stops/'+event+'?app_id='+this.app_id+'&app_key='+this.app_key)
    .pipe(
      map(response => JSON.stringify(response)),
      map(response => JSON.parse(response)),
    )
    .subscribe((bus) => {
      bus.data.ibus.map((b: any) => {this.lines.push(b.line)});
    });
  }

  /**
   * Reiniciamos las variables para que muestre el contenido inicial.
   */
  choose() {
    this.submitted = false;
    this.tiempoRealParada = false;
    this.tiempoRealLineaYParada = false;
    this.recorridoLinea = false;
    this.paradasLineaBus = false;
    this.paradasBus = false;
    /*this.horariosBus = false;
    this.horarioBusParada = false;*/
    this.horasPasoHorarioLineaBus = false;
    this.paradasCercanas = false;
    this.paradasBusDistrito = false;
    this.road = false;
    this.checkAllStopBus = false;
    this.tiempoReal = [];
    this.buses = [];
    this.paradas1km = [];
    this.dataMap = [];
    this.layerSmallMap = [];
    this.layers = [];
    this.layers2 = [];
    this.dataSmallMap = [];
    this.namesOptions = [];
    this.names = [];
    this.horario = null;
  }

  /**
   * Mapea las características de las propiedades de la llamada get de la url.
   * @param value , tipo any
   */
  featuresMap(value: any, check = true) {
    if (check) {
      let data: any = {latitud: value.features[0].geometry.coordinates[1], longitud: value.features[0].geometry.coordinates[0]}
      this.optionsAndLayers(data, 14, this.route, false);
    }
    this.buses = [];
    this.route = [];
    let dataAndLayers = this.service.featuresMap(value, this.buses, this.layers);
    this.layers = dataAndLayers[2];
    let contador = dataAndLayers[0].length;
    for (let i = 0; i < contador; i++) {
      this.namesOptions[i] = this.service.showSmallMap(dataAndLayers[0][i], dataAndLayers[1][i])[0];
      this.names[i] = this.service.showSmallMap(dataAndLayers[0][i], dataAndLayers[1][i])[1];
    }
  }

  /**
   * Mapea la latitud y longitud de la llamada get de la url.
   * @param value , tipo any
   */
   geometryMap(value: any) {
    let data: any = {latitud: value.features[0].geometry.coordinates[0][0][1], longitud: value.features[0].geometry.coordinates[0][0][0]}
    this.optionsAndLayers(data, 14, this.route, false);
    this.route = [];
    this.route = this.service.geometryMap(value);
    this.route = this.route.flatMap((x) => x);
    this.layers = this.layers;
    this.queryTitle = 'Recorrido línea: ';
  }

  /**
   * Devuelve un boolean, si el punto está un kilómetro alrededor del punto central.
   * @param checkPointLon , tipo number, longitud del punto.
   * @param centerPointLon , tipo number, longitud del punto central.
   * @param checkPointLat , tipo number, latitud del punto.
   * @param centerPointLat , tipo number, latitud del punto central.
   * @returns boolean, si el punto está dentro de la distancia.
   */
  arePointsNear(checkPointLon: number, centerPointLon: number, checkPointLat: number, centerPointLat: number) {
    return this.service.arePointsNear(checkPointLon, centerPointLon, checkPointLat, centerPointLat);
  }

  /**
   * Despliega los input radio correspondientes del elemento cliqueado.
   * @param event , tipo any, para detectar el evento que fue lanzado.
   */
  showRadioInput(event: any) {
    this.service.showRadioInput(event);
  }

  /**
   * Método lanzado cuando el mapa esté preparado.
   * @param map , tipo Map, mapa.
   */
  onMapReady(map: Map) {
    this.service.onMapReady(map, this.route);
  }

  /**
   * Todas las paradas de bus de Barcelona.
   * @param data , datos enviados desde la consulta get de la url.
   */
  allStopBus(data: any) {
    this.queryTitle = 'Paradas de Bus - Todas';
    this.checkAllStopBus = true;
    let dataMapOptions = {latitud: 41.3879, longitud: 2.16992};
    this.optionsAndLayers(dataMapOptions, 11);
    this.layers = this.service.allStopBus(data);
  }

  /**
   * Consigue todas las paradas de un distrito.
   * @param data , tipo any.
   */
  allStopBusDristrict(data: any) {
    this.queryTitle = 'Paradas de Bus - Distrito: '+this.district;
    let dataMapOptions = {latitud: 41.3879, longitud: 2.16992};
    this.optionsAndLayers(dataMapOptions, 11);
    this.namesOptions = [];
    this.names = [];
    this.buses = [];
    let dataAndLayers = this.service.allStopBusDristrict(data, this.district, this.buses);
    this.layers = dataAndLayers[2];
    let contador = dataAndLayers[0].length;
    for (let i = 0; i < contador; i++) {
      this.namesOptions[i] = this.service.showSmallMap(dataAndLayers[0][i], dataAndLayers[1][i])[0];
      this.names[i] = this.service.showSmallMap(dataAndLayers[0][i], dataAndLayers[1][i])[1];
    }
  }

  /**
   * Consigue los datos del apartado horarios.
   * @param value , tipo any.
   */
  private horarios(value: any) {
    this.queryTitle = 'Horarios';
    this.options = [];
    this.layers = [];
    this.horario = null;
    let dataMap: any[] = this.service.horarios(value);
    this.optionsAndLayers(dataMap[2], 16);
    this.layers.push(marker([dataMap[2].latitud, dataMap[2].longitud]));
    this.horario = dataMap[3];
    let dataSmallMap = dataMap[0];
    let layerSmallMap = dataMap[1];
    this.namesOptions[0] = this.service.showSmallMap(dataSmallMap[0], layerSmallMap[0])[0];
    this.names[0] = this.service.showSmallMap(dataSmallMap[0], layerSmallMap[0])[1];
  }

  /**
   * Establece el valor de options and layers.
   * @param data , tipo any, contiene latitud y longitud.
   * @param zoom, tipo number, zoom del mapa.
   * @param route, tipo any, ruta a seguir en el mapa.
   * @param check, tipo boolean, comprueba si layers tiene que ser inicializado.
   */
  private optionsAndLayers(data: { latitud: any; longitud: any; }, zoom: number, route: any = null, check = true) {
    this.options = {};
    this.options = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      control: route,
      zoom: zoom,
      center: latLng([data.latitud, data.longitud])
    };
    if (check)
      this.layers = [];
  }
}
