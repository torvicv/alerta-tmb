export class Parada {
  nombre!: string;
  codigo!: string;
  direccion!: string;
  distrito!: string;
  lineas!: string;

  constructor(nombre: string, codigo: string, direccion?: string, distrito?: string, lineas?: string) {
    this.nombre = nombre;
    this.codigo = codigo;
    if (direccion) {
      this.direccion = direccion;
    }
    if (distrito) {
      this.distrito = distrito;
    }
    if (lineas) {
      this.lineas = lineas;
    }
  }

}
