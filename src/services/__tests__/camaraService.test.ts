import * as ImagePicker from 'expo-image-picker';
import { CALIDAD_FOTO, elegirDeGaleria, tomarFoto } from '../camaraService';

/**
 * Pruebas del flujo completo de captura de imágenes.
 *
 * El módulo nativo está sustituido, así que se puede forzar cada desenlace
 * —permiso negado, cancelación, cámara que no responde— que sería imposible
 * de reproducir a mano en un dispositivo real de forma repetible.
 */

const pedirPermisoCamara = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const pedirPermisoGaleria = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const abrirCamara = ImagePicker.launchCameraAsync as jest.Mock;
const abrirGaleria = ImagePicker.launchImageLibraryAsync as jest.Mock;

const CONCEDIDO = { granted: true, canAskAgain: true, status: 'granted' };
const NEGADO = { granted: false, canAskAgain: true, status: 'denied' };
const NEGADO_PARA_SIEMPRE = { granted: false, canAskAgain: false, status: 'denied' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tomarFoto', () => {
  it('devuelve la ruta de la foto cuando todo sale bien', async () => {
    pedirPermisoCamara.mockResolvedValue(CONCEDIDO);
    abrirCamara.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///f.jpg' }] });

    await expect(tomarFoto()).resolves.toEqual({
      estado: 'exito',
      datos: 'file:///f.jpg',
    });
  });

  it('comprime la foto para no inflar el dispositivo ni el respaldo', async () => {
    pedirPermisoCamara.mockResolvedValue(CONCEDIDO);
    abrirCamara.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///f.jpg' }] });

    await tomarFoto();

    expect(abrirCamara).toHaveBeenCalledWith(
      expect.objectContaining({ quality: CALIDAD_FOTO }),
    );
    expect(CALIDAD_FOTO).toBe(0.6);
  });

  it('no abre la cámara si el usuario negó el permiso', async () => {
    pedirPermisoCamara.mockResolvedValue(NEGADO);

    const resultado = await tomarFoto();

    expect(resultado.estado).toBe('sin-permiso');
    // Lo importante: no se intenta usar el periférico sin autorización.
    expect(abrirCamara).not.toHaveBeenCalled();
  });

  it('avisa que hay que ir a ajustes si el permiso quedó negado para siempre', async () => {
    pedirPermisoCamara.mockResolvedValue(NEGADO_PARA_SIEMPRE);

    const resultado = await tomarFoto();

    expect(resultado.estado === 'sin-permiso' && resultado.puedeReintentar).toBe(false);
    expect(resultado.estado === 'sin-permiso' && resultado.mensaje).toContain('ajustes');
  });

  it('trata la cancelación del usuario como desenlace normal', async () => {
    pedirPermisoCamara.mockResolvedValue(CONCEDIDO);
    abrirCamara.mockResolvedValue({ canceled: true, assets: null });

    await expect(tomarFoto()).resolves.toEqual({ estado: 'cancelado' });
  });

  it('no propaga la excepción si el periférico falla', async () => {
    pedirPermisoCamara.mockResolvedValue(CONCEDIDO);
    abrirCamara.mockRejectedValue(new Error('cámara ocupada'));

    const resultado = await tomarFoto();

    expect(resultado.estado).toBe('error');
  });

  it('no se queda esperando para siempre si la cámara nunca responde', async () => {
    jest.useFakeTimers();
    pedirPermisoCamara.mockResolvedValue(CONCEDIDO);
    // Una promesa que jamás se resuelve: la cámara que se colgó.
    abrirCamara.mockReturnValue(new Promise(() => {}));

    const promesa = tomarFoto();
    await jest.advanceTimersByTimeAsync(16_000);
    const resultado = await promesa;

    expect(resultado.estado).toBe('error');
    expect(resultado.estado === 'error' && resultado.mensaje).toContain('demasiado');

    jest.useRealTimers();
  });
});

describe('elegirDeGaleria', () => {
  it('pide el permiso de galería, no el de cámara', async () => {
    pedirPermisoGaleria.mockResolvedValue(CONCEDIDO);
    abrirGaleria.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///g.jpg' }] });

    await elegirDeGaleria();

    expect(pedirPermisoGaleria).toHaveBeenCalled();
    expect(pedirPermisoCamara).not.toHaveBeenCalled();
  });

  it('devuelve la imagen elegida de la galería', async () => {
    pedirPermisoGaleria.mockResolvedValue(CONCEDIDO);
    abrirGaleria.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///g.jpg' }] });

    await expect(elegirDeGaleria()).resolves.toEqual({
      estado: 'exito',
      datos: 'file:///g.jpg',
    });
  });

  it('respeta la negativa del usuario', async () => {
    pedirPermisoGaleria.mockResolvedValue(NEGADO);

    expect((await elegirDeGaleria()).estado).toBe('sin-permiso');
    expect(abrirGaleria).not.toHaveBeenCalled();
  });
});
