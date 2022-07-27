import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Bus } from '../models/Bus';
import { Parada } from '../models/parada';
import { TiempoReal } from '../models/TiempoReal';
import { latLng, marker, tileLayer, Map, control } from 'leaflet';
import { ConsultaService } from '../services/consulta.service';

import "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { Horario } from '../models/horario';
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

  // dataForm = new FormControl('');
  submitted!: boolean;
  tiempoRealParada!: boolean;
  tiempoRealLineaYParada!: boolean;
  recorridoLinea!: boolean;
  paradasLineaBus!: boolean;
  paradasBus!: boolean;
  horariosBus!: boolean;
  horarioBusParada!: boolean;
  horasPasoHorarioLineaBus!: boolean;
  paradasCercanas!: boolean;
  paradasBusDistrito!: boolean;
  road!: boolean;

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
  horario!: Horario;
  lines: any = [];
  tiempoReal: TiempoReal[] = [];
  buses: Bus[] = [];
  paradas1km: Parada[] = [];
  district!: string;

  constructor(private http: HttpClient, private elementRef: ElementRef, private service: ConsultaService) {
    this.submitted = false;
    this.tiempoRealParada = false;
    this.tiempoRealLineaYParada = false;
    this.recorridoLinea = false;
    this.paradasLineaBus = false;
    this.paradasBus = false;
    this.horariosBus = false;
    this.horarioBusParada = false;
    this.horasPasoHorarioLineaBus = false;
    this.paradasCercanas = false;
    this.paradasBusDistrito = false;
    this.road = false;
    this.error = '';
   }

  ngOnInit(): void {
    // consigue todas las paradas para asignarlo al select de las paradas.
    this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key).pipe(
      map(response => JSON.stringify(response)),
      map(response => JSON.parse(response)),
      map(response => response.features),
      //filter(response => response.)
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
        case 'hB':
          this.horariosBus = true;
          break;
        case 'hBP':
          this.horarioBusParada = true;
          break;
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

    // console.log(value);
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
        this.tiempoReal.push(new TiempoReal(data.linea, bus.data.ibus[0]['text-ca'], bus.data.ibus[0]['t-in-s'], bus.data.ibus[0]['t-in-min']));
      });
    } else if (this.tiempoRealParada) {
      // all buses at bus stop
      this.http.get('https://api.tmb.cat/v1/ibus/stops/'+data.parada+'?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe((bus) => {
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
        error: () => this.handleError('linea')
      });
    } else if (this.paradasLineaBus) {
      // get all bus stops by bus line.
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.featuresMap.bind(this),
        error: () => this.handleError('linea')
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
        error: () => this.handleError('parada')
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
        error: () => this.handleError('parada')
      });
    } else if (this.horariosBus) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/horaris?app_id='+this.app_id+'&app_key='+this.app_key)
      .subscribe(bus => console.log(bus));
    } else if (this.horarioBusParada) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades/'+data.parada+'/horaris?app_id='+this.app_id+'&app_key='+this.app_key)
      .subscribe(bus => console.log(bus));
    } else if (this.horasPasoHorarioLineaBus) {
      this.http.get('https://api.tmb.cat/v1/transit/linies/bus/'+data.linea+'/parades/'+data.parada+'/horespas?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        map(response => JSON.stringify(response)),
        map(response => JSON.parse(response))
      ).subscribe({
        next: this.horarios.bind(this),
        error: this.handleError.bind('línea')
      });
    } else if (this.paradasCercanas) {
      this.http.get('https://api.tmb.cat/v1/transit/parades?app_id='+this.app_id+'&app_key='+this.app_key)
      .pipe(
        // transform to string
        map(response => JSON.stringify(response)),
        // from string to object
        map(response => JSON.parse(response))
      ).subscribe((paradas) => {
        let stops = paradas.features.filter((parada: any) => {
          let checkPoints = this.arePointsNear(data.longitud, parada.geometry.coordinates[0], data.latitud,
            parada.geometry.coordinates[1]);
          return checkPoints;
        });

        // console.log(stops);
        let contador = 0;
        stops.map((stop: any) => {
          let stopsLines = '';
          this.dataMap.push(
            //{latitude: stop.geometry.coordinates[0], longitude: stop.geometry.coordinates[1], name: stop.properties.NOM_PARADA}
            marker([stop.geometry.coordinates[1], stop.geometry.coordinates[0]])
              .bindPopup('Parada: '+stop.properties.NOM_PARADA+'<br/>Distrito: '+stop.properties.NOM_DISTRICTE+'<br/>Dirección: '+stop.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+stop.properties.CODI_PARADA+'">Ver</a>')
          );
          let dataSmallMap = {latitud: stop.geometry.coordinates[1],longitud: stop.geometry.coordinates[0]}
          let layerSmallMap = marker([stop.geometry.coordinates[1], stop.geometry.coordinates[0]]);

          this.dataSmallMap.push(dataSmallMap);
          this.layerSmallMap.push(layerSmallMap);
          this.names.push(`layer`+contador);
          this.namesOptions.push(`option`+contador);
          //this.showSmallMap(dataSmallMap, layerSmallMap);

          this.http.get('https://api.tmb.cat/v1/ibus/stops/'+stop.properties.CODI_PARADA+'?app_id='+this.app_id+'&app_key='+this.app_key)
          .pipe(
            map(response => JSON.stringify(response)),
            map(response => JSON.parse(response))
          ).subscribe((bus) => {
            bus.data.ibus.map((b: any) => {
              stopsLines += b.line + ', '
            });
            // console.log(stopsLines);
            this.paradas1km.push(new Parada(stop.properties.NOM_PARADA, stop.properties.CODI_PARADA,
              stop.properties.ADRECA, stop.properties.NOM_DISTRICTE, stopsLines));
          });
        });
        for (let i = 0; i < this.dataSmallMap.length; i++) {
          this.showSmallMap(this.dataSmallMap[i], this.layerSmallMap[i], i);
        }
        this.showMap(data);
      });
    }
  }

  /**
   * Muestra el mapa grande, donde están todas las paradas.
   * @param data , tipo any, datos como la latitud y la longitud.
   */
  private showMap(data: any) {
    this.layers = this.dataMap;
    this.options = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 12,
      center: latLng([ data.latitud, data.longitud ])
    };
  }

  /**
   * Muestra un mapa pequeño para cada parada.
   * @param data , tipo any, datos como la longitud y la latitud.
   * @param layer , tipo any, marcador con los datos de la parada para cada mapa pequeño.
   * @param i , tipo any, contador.
   */
  private showSmallMap(data: any, layer: any, i: any) {
    this.names[i] = layer;
    this.namesOptions[i] = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 17,
      center: latLng([ data.latitud, data.longitud ])
    };
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
        // console.log(this.lines);
      });
    // console.log(event);
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
    this.horariosBus = false;
    this.horarioBusParada = false;
    this.horasPasoHorarioLineaBus = false;
    this.paradasCercanas = false;
    this.road = false;
    this.tiempoReal = [];
    this.buses = [];
    this.paradas1km = [];
  }

  /**
   * Mapea las características de las propiedades de la llamada get de la url.
   * @param value , tipo any
   */
  featuresMap(value: any, check = true) {
    let dataMap: any[] = [];
    if (check) {
      this.options = {
        layers: [
          tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=', {
            attribution: '&copy; OpenStreetMap contributors'
          }),
        ],
        control: this.route,
        zoom: 14,
        center: latLng([ value.features[0].geometry.coordinates[1], value.features[0].geometry.coordinates[0] ])
      };
    }
    // console.log(value);
    // let routeAnada: any[] = [];
    // let routeTornada: any[] = [];
    value.features.map((bf: any) => {
      /*if (bf.properties.ID_SENTIT === 1)
        routeAnada.push(L.latLng(bf.geometry.coordinates[1], bf.geometry.coordinates[0]));
      if (bf.properties.ID_SENTIT === 2)
        routeTornada.push(L.latLng(bf.geometry.coordinates[1], bf.geometry.coordinates[0]));*/
      dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
      .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'))
      let p = bf.properties;
      this.buses.push(new Bus(p.ADRECA, p.NOM_LINIA, p.CODI_PARADA, p.NOM_DISTRICTE,
        p.NOM_VIA, p.NOM_PARADA, p.DESTI_SENTIT));
    });
    // this.route = [];
    // this.route = [routeAnada, routeTornada];
    // this.route = this.route.flatMap((x) => x);
    this.layers = dataMap;
  }

  /**
   * Mapea la latitud y longitud de la llamada get de la url.
   * @param value , tipo any
   */
   geometryMap(value: any) {
    // this.featuresMap(value);
    let route: any[] = [];
    this.options = {
      layers: [
        tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=', {
          attribution: '&copy; OpenStreetMap contributors'
        }),
      ],
      control: this.route,
      zoom: 14,
      center: latLng([ value.features[0].geometry.coordinates[0][0][1], value.features[0].geometry.coordinates[0][0][0] ])
    };
    value.features[0].geometry.coordinates[0].map((bf: any) => {
      route.push(L.latLng(bf[1], bf[0]));
    });
    value.features[1].geometry.coordinates[0].map((bf: any) => {
      route.push(L.latLng(bf[1], bf[0]));
    });
    // console.log(value);
    this.route = [];
    this.route = route;
    this.route = this.route.flatMap((x) => x);
    this.layers = this.layers;
    this.road = true;
    this.queryTitle = 'Recorrido línea: ';
  }

  /**
   * Asigna un valor a la propiedad error.
   * @param error , tipo string.
   */
  handleError(error: any) {
    console.log(error);
    this.error = "No tenemos datos de esa "+ error +"!!!";
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
    var kx = 40000 / 360;
    var ky = Math.cos(Math.PI * centerPointLat / 180.0) * kx;
    var dx = Math.abs(centerPointLat - checkPointLat) * ky;
    var dy = Math.abs(centerPointLon - checkPointLon) * kx;
    return Math.sqrt(dx * dx + dy * dy) <= 1;
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
    const myAPIKey = "";
    var waypoints!: any;
    // creamos un string con todos los waypoints encadenados.
    for (let i = 0; i < this.route.length; i++) {
      let waypoint = [this.route[i].lat, this.route[i].lng];// latitud, longitud
      waypoints += `${waypoint.join(',')}|`;
    }
    if (waypoints != undefined && waypoints.length > 0) {
      waypoints = waypoints.replace(/undefined/g, '');
      waypoints = waypoints.replace(/\|$/, '');
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=bus&details=instruction_details&apiKey=${myAPIKey}`;
      fetch(url).then(res => res.json()).then(result => {
          console.log(result);
          L.geoJSON(result, {
            style: () => {
              return {
                color: "rgba(20, 137, 255, 0.7)",
                weight: 2
              };
            }
          }).addTo(map);
      }, error => console.log(error));
    }
    // let that = this;
    // var route = L.Routing.control({
    /*for (let i = 0; i < this.route.length; i++) {
      L.Routing.control({
        waypoints: [this.route[i], this.route[i+1]],
        draggableWaypoints: false,
      }).addTo(map);
    }*/

  // L.Routing.errorControl(control).addTo(map);
    // route.setWaypoints(this.route);
    // route.setWaypoints(this.routeTornada);
  }

  /**
   * Todas las paradas de bus de Barcelona.
   * @param data , datos enviados desde la consulta get de la url.
   */
  allStopBus(data: any) {
    this.queryTitle = 'Paradas de Bus - Todas';
    this.layers = this.dataMap;
    this.options = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 11,
      center: latLng([ 41.3879, 2.16992 ])
    };
    data.features.map((bf: any) => {
      this.dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
      .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'))
      let p = bf.properties;
      this.buses.push(new Bus(p.ADRECA, p.NOM_LINIA, p.CODI_PARADA, p.NOM_DISTRICTE,
        p.NOM_VIA, p.NOM_PARADA, p.DESTI_SENTIT));
    });
  }

  allStopBusDristrict(data: any) {
    this.queryTitle = 'Paradas de Bus - Distrito: '+this.district;
    this.layers = this.dataMap;
    this.options = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 11,
      center: latLng([ 41.3879, 2.16992 ])
    };
    console.log(data);
    let dataSmallMap: any[] = [];
    let layerSmallMap: any[] = [];
    data.features.map((bf: any) => {
      let p = bf.properties;
      if (p.NOM_DISTRICTE === this.district) {
        this.dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
        .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'))

        this.buses.push(new Bus(p.ADRECA, p.NOM_LINIA, p.CODI_PARADA, p.NOM_DISTRICTE,
          p.NOM_VIA, p.NOM_PARADA, p.DESTI_SENTIT));
        layerSmallMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]]));
        dataSmallMap.push({latitud: bf.geometry.coordinates[1],longitud: bf.geometry.coordinates[0]})
      }
    });
    for (let i = 0; i < dataSmallMap.length; i++) {
      this.showSmallMap(dataSmallMap[i], layerSmallMap[i], i);
    }
  }

  private horarios(value: any) {
    console.log(value);
    let direccion = '';
    let parada = '';
    let via = '';
    let distrito = '';
    let sentido = '';
    let diarios = '';
    let sabado = '';
    let festivos = '';
    value.features.map((horario: any) => {
      let prop = horario.properties;
      let horas: string = prop.LITERAL;
      direccion = prop.ADRECA;
      parada = prop.NOM_PARADA;
      via = prop.NOM_VIA;
      distrito = prop.NOM_DISTRICTE;
      sentido = prop.DESC_SENTIT;
      diarios = '';
      sabado = '';
      festivos = '';
      if (prop.DESC_TIPUS_DIA.toLowerCase() === 'feiners') {
        diarios += horas;
      } else if (prop.DESC_TIPUS_DIA.toLowerCase() === 'dissabtes') {
        sabado += horas;
      } else if (prop.DESC_TIPUS_DIA.toLowerCase() === 'festius i diumenges') {
        festivos += horas;
      }
       else if (prop.DESC_TIPUS_DIA.toLowercase() === 'dissabtes') {
        sabado += prop.HORARI;
      }
    });
    this.horario = new Horario(direccion, parada, distrito, via, sentido, diarios, sabado, festivos);
    console.log(this.horario);
  }

}
