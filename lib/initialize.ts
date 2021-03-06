import HookTools from "./hookTools";
import {resolve} from "path";
import afterHook from "./afterHook";

/**
 * SET BLUEBIRD AS GLOBAL PROMISE
 * Use @types/bluebird-global in devDep
 */
import * as Bluebird from 'bluebird'
global.Promise = <any>Bluebird;

const State = require('sails-hook-stateflow').State;

/**
 * Initialize hook. If sails.config.restocore not exists hook will not be loaded.
 * Bind models.
 * @param sails
 * @constructor
 */
export default function ToInitialize(sails) {
  /**
   * List of hooks that required
   */
  const requiredHooks = [
    'blueprints',
    'http',
    'orm',
    'policies'
  ];

  return function initialize(cb) {
    /**
     * CONFIG
     */
    // If disabled. Do not load anything
    if (!HookTools.checkConfig('restocore')) {
      return cb();
    }

    /**
     * AFTER OTHERS HOOKS
     */
    HookTools.waitForHooks('restocore', requiredHooks, afterHook);

    /**
     * Set cart states in sails-hook-stateflow
     */
    sails.stateflow = [
      new State('CART', ['CHECKOUT'], function (cb) {
        cb(null, true);
      }),
      new State('CHECKOUT', ['ORDER', 'PAYMENT', 'CART'], function (cb) {
        /**
         * CHECKOUT -> ORDER если тип платежной "promise", или отсутствует
         * CHECKOUT -> CART  В любой момент (без условий)
         * CHECKOUT -> PAYMENT  Если тип платежной системы "ixternal" || "internal". 
         */
        cb(null, true);
      }),
      new State('PAYMENT', ['ORDER', 'CHECKOUT'], function (cb) {
        /**
         * PAYMENT -> ORDER при успешной оплате.
         * PAYMENT -> CHECKOUT при неуспешной оплате
         */
        cb(null, true);
      }),
      new State('ORDER', [], function (cb) {
        cb(null, true);
      })
    ];

    /**
     * MODELS
     */
    HookTools.bindModels(resolve(__dirname, '../models')).then(cb);
  }
};
