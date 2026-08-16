import { Alert, Linking } from 'react-native';
import { avisarFalloPeriferico } from '../avisos';

/**
 * Pruebas del aviso ante un periférico que no se pudo usar.
 *
 * Lo que se verifica es la cortesía y la salida: no molestar cuando el
 * usuario canceló a propósito, y ofrecer los ajustes cuando es la única vía
 * que le queda para conceder el permiso.
 */

const alertar = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const abrirAjustes = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
});

it('no muestra nada cuando la operación tuvo éxito', () => {
  avisarFalloPeriferico({ estado: 'exito', datos: 'file:///f.jpg' }, 'Cámara');

  expect(alertar).not.toHaveBeenCalled();
});

it('no molesta al usuario que canceló a propósito', () => {
  avisarFalloPeriferico({ estado: 'cancelado' }, 'Cámara');

  expect(alertar).not.toHaveBeenCalled();
});

it('muestra un aviso simple ante un error', () => {
  avisarFalloPeriferico({ estado: 'error', mensaje: 'No se pudo abrir.' }, 'Cámara');

  expect(alertar).toHaveBeenCalledWith('Cámara', 'No se pudo abrir.');
});

it('muestra un aviso simple si el permiso todavía se puede volver a pedir', () => {
  avisarFalloPeriferico(
    { estado: 'sin-permiso', puedeReintentar: true, mensaje: 'Necesitamos la cámara.' },
    'Cámara',
  );

  expect(alertar).toHaveBeenCalledWith('Cámara', 'Necesitamos la cámara.');
});

describe('permiso denegado definitivamente', () => {
  function avisarDenegado(): void {
    avisarFalloPeriferico(
      { estado: 'sin-permiso', puedeReintentar: false, mensaje: 'Habilitalo en ajustes.' },
      'Cámara',
    );
  }

  it('ofrece abrir los ajustes, la única salida que le queda al usuario', () => {
    avisarDenegado();

    const [, , botones] = alertar.mock.calls[0];
    expect(botones?.map((boton) => boton.text)).toEqual(['Ahora no', 'Abrir ajustes']);
  });

  it('abre los ajustes al confirmar', () => {
    avisarDenegado();

    const [, , botones] = alertar.mock.calls[0];
    botones?.[1].onPress?.();

    expect(abrirAjustes).toHaveBeenCalled();
  });

  it('no abre nada si el usuario elige seguir sin el permiso', () => {
    avisarDenegado();

    const [, , botones] = alertar.mock.calls[0];
    botones?.[0].onPress?.();

    expect(abrirAjustes).not.toHaveBeenCalled();
  });
});
