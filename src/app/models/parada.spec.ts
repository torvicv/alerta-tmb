import { Parada } from './parada';

describe('Parada', () => {
  it('should create an instance', () => {
    expect(new Parada('Tibidabo', '123', 'Tibidabo 35', 'Horta-Guinardo', '1, 2, 3')).toBeTruthy();
  });
});
