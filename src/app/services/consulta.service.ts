import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {

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
}
