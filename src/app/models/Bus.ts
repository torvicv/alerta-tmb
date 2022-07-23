export class Bus {
  direccion!: string;
  linea!: string;
  parada!: string;
  distrito!: string;
  nombreVia!: string;
  nombreParada!: string;
  sentido!: string;
  constructor(direccion: string, linea: string, parada: string, distrito: string, nombreVia: string,
    nombreParada: string, sentido: string) {
      this.direccion = direccion;
      this.linea = linea;
      this.parada = parada;
      this.distrito = distrito;
      this.nombreVia = nombreVia;
      this.nombreParada = nombreParada;
      this.sentido = sentido;
    }
}
