export class Horario {
  direccion!: string;
  parada!: string;
  distrito!: string;
  via!: string;
  sentido!: string;
  diario!: string;
  sabado!: string;
  festivo!: string;

  constructor(direccion: string, parada: string, distrito: string, via: string, sentido: string,
    diario: string, sabado: string, festivo: string) {
      this.direccion = direccion;
      this.parada = parada;
      this.distrito = distrito;
      this.via = via;
      this.sentido = sentido;
      this.diario = diario;
      this.sabado = sabado;
      this.festivo = festivo;
    }
}
