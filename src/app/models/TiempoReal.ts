export class TiempoReal {
  linea!: string;
  texto!: string;
  tiempoSegundos!: string;
  tiempoMinutos!: string;
  constructor(linea: string, texto: string, tiempoSegundos: string, tiempoMinutos: string) {
    this.linea = linea;
    this.texto = texto;
    this.tiempoSegundos = tiempoSegundos;
    this.tiempoMinutos = tiempoMinutos;
  }
}
