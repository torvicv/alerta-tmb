import { Injectable } from '@angular/core';
import { latLng, Map, marker, tileLayer } from 'leaflet';
import { Bus } from '../models/Bus';
import { Horario } from '../models/horario';
declare let L: any;

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {

  // key de geoapify
  myApiKey: string = ''

  constructor() { }

  /**
   * Oculta o muestra el elemento.
   * @param event , tipo any, elemento que contiene el click.
   */
  showRadioInput(event: any) {
    let element = event.target.parentElement.parentElement.parentElement.lastChild;
    if (element.style.display === 'flex') {
      element.style.display = 'none';
    } else {
      element.style.display = 'flex';
    }

  }

  /**
   * Método lanzado cuando el mapa esté preparado.
   * @param map , tipo Map, mapa.
   */
   onMapReady(map: Map, route: any[]) {
    var waypoints!: any;
    // creamos un string con todos los waypoints encadenados.
    for (let i = 0; i < route.length; i++) {
      let waypoint = [route[i].lat, route[i].lng];// latitud, longitud
      waypoints += `${waypoint.join(',')}|`;
    }
    if (waypoints != undefined && waypoints.length > 0) {
      waypoints = waypoints.replace(/undefined/g, '');
      waypoints = waypoints.replace(/\|$/, '');
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=bus&details=instruction_details&apiKey=${this.myApiKey}`;
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
   * Mapea la latitud y longitud de la llamada get de la url.
   * @param value , tipo any
   */
   geometryMap(value: any) {
    let route: any[] = [];
    value.features[0].geometry.coordinates[0].map((bf: any) => {
      route.push(L.latLng(bf[1], bf[0]));
    });
    value.features[1].geometry.coordinates[0].map((bf: any) => {
      route.push(L.latLng(bf[1], bf[0]));
    });
    return route;
  }

  allStopBus(data: any) {
    let dataMap: any[] = [];
    data.features.map((bf: any) => {
      dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
      .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'));
    });
    return dataMap;
  }

  /**
   * Consigue todas las paradas de un distrito.
   * @param data , tipo any.
   */
  allStopBusDristrict(data: any, district: string, buses: any[]) {
    let dataMap: any[] = [];
    let dataSmallMap: any[] = [];
    let layerSmallMap: any[] = [];
    data.features.map((bf: any) => {
      let p = bf.properties;
      if (p.NOM_DISTRICTE === district) {
        dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
        .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'))

        buses.push(new Bus(p.ADRECA, p.NOM_LINIA, p.CODI_PARADA, p.NOM_DISTRICTE,
          p.NOM_VIA, p.NOM_PARADA, p.DESTI_SENTIT));
        layerSmallMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]]));
        dataSmallMap.push({latitud: bf.geometry.coordinates[1],longitud: bf.geometry.coordinates[0]})
      }
    });
    return [dataSmallMap, layerSmallMap, dataMap];
  }

  /**
     * Muestra un mapa pequeño para cada parada.
     * @param data , tipo any, datos como la longitud y la latitud.
     * @param layer , tipo any, marcador con los datos de la parada para cada mapa pequeño.
     * @param i , tipo any, contador.
     */
  showSmallMap(data: any, layer: any) {
    let names = layer;
    let namesOptions = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 17,
      center: latLng([ data.latitud, data.longitud ])
    };
    return [namesOptions, names];
  }

  /**
   * Mapea las características de las propiedades de la llamada get de la url.
   * @param value , tipo any
   */
   featuresMap(value: any, buses: any[], layers: any[]) {
    let dataMap: any[] = [];
    let layerSmallMap: any[] = [];
    let dataSmallMap: any[] = [];
    value.features.map((bf: any) => {
      dataMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]])
      .bindPopup('Parada: '+bf.properties.NOM_PARADA+'<br/>Distrito: '+bf.properties.NOM_DISTRICTE+'<br/>Dirección: '+bf.properties.ADRECA+'<br><a class="ver" href="/consultar#p'+bf.properties.CODI_PARADA+'">Ver</a>'))
      let p = bf.properties;
      buses.push(new Bus(p.ADRECA, p.NOM_LINIA, p.CODI_PARADA, p.NOM_DISTRICTE,
        p.NOM_VIA, p.NOM_PARADA, p.DESTI_SENTIT));
      layerSmallMap.push(marker([bf.geometry.coordinates[1], bf.geometry.coordinates[0]]));
      dataSmallMap.push({latitud: bf.geometry.coordinates[1],longitud: bf.geometry.coordinates[0]})
    });
    layers = dataMap;
    return [dataSmallMap, layerSmallMap, dataMap];
  }

     /**
   * Consigue los datos del apartado horarios.
   * @param value , tipo any.
   */
  horarios(value: any) {
    let direccion = '';
    let parada = '';
    let via = '';
    let distrito = '';
    let sentido = '';
    let diarios = '';
    let sabado = '';
    let festivos = '';
    let contadorFL = 0;
    let contadorDL = 0;
    let contadorDIF = 0;
    let data = {latitud: value.features[0].geometry.coordinates[1], longitud: value.features[0].geometry.coordinates[0]}
    value.features.map((horario: any) => {
      let prop = horario.properties;
      let horas: string = prop.LITERAL;
      horas = horas.replace('#FROM#', 'DESDE');
      horas = horas.replace('#TO#', 'A');
      horas = horas.replace('#EVERY#', 'CADA');
      horas = horas.replace('#MINUTES#', 'MINUTOS');
      direccion = prop.ADRECA;
      parada = prop.NOM_PARADA;
      via = prop.NOM_VIA;
      distrito = prop.NOM_DISTRICTE;
      sentido = prop.DESC_SENTIT;
      let feinersLength: any = value.features.filter((fL: any) => {
        return fL.properties.DESC_TIPUS_DIA.toLowerCase() ===  'feiners';
      });
      let dissabtesLength: any = value.features.filter((dL: any) => {
        return dL.properties.DESC_TIPUS_DIA.toLowerCase() ===  'dissabtes';
      });
      let festiusLength: any = value.features.filter((fL: any) => {
        return fL.properties.DESC_TIPUS_DIA.toLowerCase() ===  'festius i diumenges';
      });
      if (prop.DESC_TIPUS_DIA.toLowerCase() === 'feiners') {
        if (contadorFL === feinersLength.length-1) {
          diarios += horas;
        } else {
          diarios += horas + ' - ';
        }
        contadorFL++;
      } else if (prop.DESC_TIPUS_DIA.toLowerCase() === 'dissabtes') {
        if (contadorDL === dissabtesLength.length-1) {
          sabado += horas;
        } else {
          sabado += horas + ' - ';
        }
        contadorDL++;
      } else if (prop.DESC_TIPUS_DIA.toLowerCase() === 'festius i diumenges') {
        if (contadorDIF === festiusLength.length-1) {
          festivos += horas;
        } else {
          festivos += horas + ' - ';
        }
        contadorDIF++;
      }
    });
    let dataSmallMap: any[] = [];
    let layerSmallMap: any[] = [];
    dataSmallMap.push({latitud: data.latitud,longitud: data.longitud});
    layerSmallMap.push(marker([data.latitud, data.longitud]));
    let horario: Horario = new Horario(direccion, parada, distrito, via, sentido, diarios, sabado, festivos);
    return [dataSmallMap, layerSmallMap, data, horario];
  }
}
