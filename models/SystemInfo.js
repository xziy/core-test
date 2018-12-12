/**
 * @api {API} SystemInfo SystemInfo
 * @apiGroup Models
 * @apiDescription Системная информация (в данный момент ревизия)
 *
 * @apiParam {Integer} id ID
 * @apiParam {String} revision Ревизия меню
 * @apiParam {String} revisionStopList Ревизия стоп списка
 * @apiParam {String} revisionOrders Ревизия заказов
 *
 */

module.exports = {
  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    key: 'string',
    value: 'string',
    section: 'string'
    /*revision: 'string',
    revisionStopList: 'string',
    revisionOrders: 'string',
    data: 'json',
    email: 'string',
    checkProblem: 'string',
    orderProblem: 'string'*/
  }
};

