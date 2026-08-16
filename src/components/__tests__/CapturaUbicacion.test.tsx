import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CapturaUbicacion from '../CapturaUbicacion';
import { obtenerUbicacion } from '../../services/ubicacionService';
import { avisarFalloPeriferico } from '../../utils/avisos';

/**
 * Prueba de la captura de coordenadas tal como la usa una persona.
 *
 * Verifica el recorrido completo desde el toque en pantalla hasta lo que se
 * muestra, que es lo único que ninguna prueba de función suelta cubre.
 */

jest.mock('../../services/ubicacionService', () => ({
  obtenerUbicacion: jest.fn(),
  formatearUbicacion: jest.requireActual('../../services/interpretes').formatearUbicacion,
}));

jest.mock('../../utils/avisos', () => ({ avisarFalloPeriferico: jest.fn() }));

const pedirUbicacion = obtenerUbicacion as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

it('muestra que no hay ubicación antes de capturarla', () => {
  render(<CapturaUbicacion etiqueta="Dónde" ubicacion={undefined} onCambiar={jest.fn()} />);

  expect(screen.getByText('Sin ubicación registrada')).toBeTruthy();
});

it('entrega las coordenadas al capturarlas', async () => {
  const alCambiar = jest.fn();
  pedirUbicacion.mockResolvedValue({
    estado: 'exito',
    datos: { latitud: -33.4489, longitud: -70.6693 },
  });

  render(<CapturaUbicacion etiqueta="Dónde" ubicacion={undefined} onCambiar={alCambiar} />);
  fireEvent.press(screen.getByLabelText('Capturar la ubicación actual'));

  await waitFor(() =>
    expect(alCambiar).toHaveBeenCalledWith({ latitud: -33.4489, longitud: -70.6693 }),
  );
});

it('muestra las coordenadas ya capturadas en formato legible', () => {
  render(
    <CapturaUbicacion
      etiqueta="Dónde"
      ubicacion={{ latitud: -33.4489, longitud: -70.6693 }}
      onCambiar={jest.fn()}
    />,
  );

  expect(screen.getByText('33.4489° S, 70.6693° O')).toBeTruthy();
});

it('avisa y no guarda nada si el permiso fue denegado', async () => {
  const alCambiar = jest.fn();
  pedirUbicacion.mockResolvedValue({
    estado: 'sin-permiso',
    puedeReintentar: false,
    mensaje: 'Habilitalo en ajustes.',
  });

  render(<CapturaUbicacion etiqueta="Dónde" ubicacion={undefined} onCambiar={alCambiar} />);
  fireEvent.press(screen.getByLabelText('Capturar la ubicación actual'));

  await waitFor(() => expect(avisarFalloPeriferico).toHaveBeenCalled());
  expect(alCambiar).not.toHaveBeenCalled();
});

it('permite quitar una ubicación ya registrada', () => {
  const alCambiar = jest.fn();

  render(
    <CapturaUbicacion
      etiqueta="Dónde"
      ubicacion={{ latitud: 1, longitud: 2 }}
      onCambiar={alCambiar}
    />,
  );
  fireEvent.press(screen.getByLabelText('Quitar la ubicación'));

  expect(alCambiar).toHaveBeenCalledWith(undefined);
});

it('no ofrece quitar cuando todavía no hay ubicación', () => {
  render(<CapturaUbicacion etiqueta="Dónde" ubicacion={undefined} onCambiar={jest.fn()} />);

  expect(screen.queryByLabelText('Quitar la ubicación')).toBeNull();
});
