import RMSAdapter from './rms/RMSAdapter';
import MapAdapter from './map/MapAdapter';
import ImageAdapter from "./image/ImageAdapter";
import PaymentAdapter from './payment/PaymentAdapter';

/**
 * Отдаёт запрашиваемый RMS-адаптер
 */
export class RMS {
  public static getAdapter(adapterName: string): typeof RMSAdapter {
    const adapterFind = '@webresto/' + adapterName.toLowerCase() + '-rms-adapter';
    try {
      const adapter = require(adapterFind);
      return adapter.RMS[adapterName.toUpperCase()];
    } catch (e) {
      throw new Error('Module ' + adapterFind + ' not found');
    }
  }
}

/**
 * Отдаёт запрашиваемый Map-адаптер
 */
export class Map {
  public static getAdapter(adapterName: string): new (config) => MapAdapter {
    adapterName = '@webresto/' + adapterName.toLowerCase() + '-map-adapter';
    try {
      const adapter: { MapAdapter: { default: new (config) => MapAdapter } } = require(adapterName);
      return adapter.MapAdapter.default;
    } catch (e) {
      throw new Error('Module ' + adapterName + ' not found');
    }
  }
}

/**
 * Отдаёт запрашиваемый Image-адаптер
 */
export class ImageA {
  public static getAdapter(adapterName: string): ImageAdapter {
    adapterName = '@webresto/' + adapterName.toLowerCase() + '-image-adapter';
    try {
      const adapter = require(adapterName);
      return adapter.ImageAdapter.default;
    } catch (e) {
      throw new Error('Module ' + adapterName + ' not found');
    }
  }
}
  /**
 * Отдаёт запрашиваемый Payment-адаптер
 */
export class Payment {
  public static getAdapter(adapterName: string): PaymentAdapter {
    adapterName = '@webresto/' + adapterName.toLowerCase() + '-payment-adapter';
    try {
      const adapter = require(adapterName);
      return adapter.PaymentAdapter[adapterName.toUpperCase()];
    } catch (e) {
      throw new Error('Module ' + adapterName + ' not found');
    }
  }
}
