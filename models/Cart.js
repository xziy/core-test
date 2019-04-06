// noinspection JSUnusedGlobalSymbols
/**
 * @api {API} Cart Cart
 * @apiGroup Models
 * @apiDescription Модель корзины. Имеет в себе список блюд, данные про них, методы для добавления/удаления блюд
 *
 * @apiParam {Integer} id Уникальный идентификатор
 * @apiParam {String} cartId ID корзины, по которой к ней обращается внешнее апи
 * @apiParam {CartDish[]} dishes Массив блюд в текущей корзине. Смотри CartDish
 * @apiParam {Integer} countDishes Общее количество блюд в корзине (с модификаторами)
 * @apiParam {Integer} uniqueDishes Количество уникальных блюд в корзине
 * @apiParam {Integer} cartTotal Полная стоимость корзины
 * @apiParam {Float} delivery Стоимость доставки
 * @apiParam {Boolean} problem Есть ли проблема с отправкой на IIKO
 */

/*
 * @api {API}
 * @apiGroup
 * @apiDescription
 *
 * @apiParam {}
 * @apiParam {}
 * @apiParam {}
 * @apiParam {}
 * @apiParam {}
 */

module.exports = {
  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    cartId: 'string',
    dishes: {
      collection: 'cartDish',
      via: 'cart'
    },
    dishesCount: 'integer',
    uniqueDishes: 'integer',
    cartTotal: 'float',
    modifiers: 'json',
    delivery: 'float',
    customer: 'json',
    address: 'json',
    comment: 'string',
    personsCount: 'integer',
    problem: {
      type: 'boolean',
      defaultsTo: false
    },
    sendToIiko: {
      type: 'boolean',
      defaultsTo: false
    },
    iikoId: 'string',
    deliveryStatus: 'string',
    selfDelivery: {
      type: 'boolean',
      defaultsTo: false
    },

    /**
     * @description Add dish in cart
     * @param dish - dish object
     * @param amount
     * @param modifiers - json
     * @param comment
     * @param from
     * @param cb
     * @returns {error, cart}
     */
    addDish: function (dish, amount, modifiers, comment, cb, from) {
      if (typeof amount !== 'number')
        return cb({error: 'amount must be a number'});
      if (dish.balance !== -1)
        if (amount > dish.balance)
          return cb({error: 'There is no so mush dishes ' + dish.id});

      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        async.each(modifiers, (m, cb) => {
          if (!m.amount)
            m.amount = 1;
          cb();
        }, () => {
          CartDish.create({
            dish: dish.id,
            cart: this.id,
            amount: parseInt(amount),
            modifiers: modifiers,
            comment: comment,
            addedBy: from
          }).exec((err) => {
            if (err) return cb({error: err});

            // sails.log.info(modifiers);
            cart.next('CART').then(() => {
              cb(null, cart);
            }, err => {
              cb(err);
            });
          });
        });
      });
    },

    /**
     * @description Remove dish from cart
     * @param dishId
     * @param amount
     * @param cb
     * @return {error, cart}
     */
    removeDish: function (dishId, amount, cb) {
      if (typeof amount !== 'number')
        return cb({error: 'amount must be a number'});
      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.findOne({cart: cart.id, id: dishId}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});
          if (!cartDishes) return cb({error: 404});

          const get = cartDishes;
          get.amount -= parseInt(amount);
          if (get.amount > 0) {
            CartDish.update({id: get.id}, {amount: get.amount}).exec((err) => {
              if (err) return cb({error: err});

              cart.next('CART').then(() => {
                cb(null, cart);
              }, err => {
                cb(err);
              });
            });
          } else {
            get.destroy();
            cart.next('CART').then(() => {
              count(cart, () => {
                cb(null, cart);
              });
            }, err => {
              cb(err);
            });
          }
        });
      });
    },

    count: count,

    /**
     * Set dish count
     * @param dish
     * @param amount
     * @param cb
     * @return {error, cart}
     */
    setCount: function (dish, amount, cb) {
      if (typeof amount !== 'number')
        return cb({error: 'amount must be a number'});
      if (dish.balance !== -1)
        if (amount > dish.balance)
          return cb({error: 'There is no so mush dishes ' + dish.id});

      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.find({cart: cart.id}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});

          let get = null;
          async.each(cartDishes, (item, cb) => {
            if (item.dish.id === dish.id)
              get = item;
            cb();
          }, () => {
            if (get) {
              get.amount = parseInt(amount);
              if (get.amount > 0) {
                CartDish.update({id: get.id}, {amount: get.amount}).exec((err) => {
                  if (err) return cb({error: err});

                  cart.next('CART').then(() => {
                    count(cart, () => {
                      cb(null, cart);
                    });
                  }, err => {
                    cb(err);
                  });
                });
              } else {
                get.destroy();
                cart.next('CART').then(() => {
                  count(cart, () => {
                    cb(null, cart);
                  });
                }, err => {
                  cb(err);
                });
              }
            } else {
              return cb({error: 404});
            }
          });
        });
      });
    },

    /**
     * Set modifier count
     * @param dish
     * @param modifier
     * @param amount
     * @param cb
     * @return {*}
     */
    setModifierCount: function (dish, modifier, amount, cb) {
      if (modifier.balance !== -1)
        if (amount > modifier.balance)
          return cb({error: 'There is no so mush dishes ' + modifier.id});

      CartDish.find({cart: this.id}).populate(['dish', 'modifiers']).exec((err, cartDishes) => {
        if (err) return cb({error: err});

        let get = null;
        cartDishes.forEach(item => {
          if (item.dish.id === dishId)
            get = item;
        });

        Dish.findOne({id: dishId})/*.populate('modifiers')*/.exec((err, dish) => {
          if (err) return cb({error: err});

          // check that dish has this modifier
          let get1 = null;
          dish.modifiers.forEach(item => {
            if (item.id === modifier.id)
              get1 = item;
          });

          if (get1) {
            // modifier
            let get2 = null;
            get.modifiers.forEach(item => {
              if (modifier.id === item.dish)
                get2 = item;
            });

            if (get2) {
              get2.amount = parseInt(amount);

              CartDish.update({id: get2.id}, {amount: get2.amount}).exec((err) => {
                if (err) return cb({error: err});

                countDish(get, function () {
                  return cb(null, this);
                });
              });
            } else {
              return cb({error: 404});
            }
          } else {
            return cb({error: 404});
          }
        });
      });
    },

    setComment: function (dish, comment, cb) {
      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.find({cart: cart.id}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});

          let get = null;
          async.each(cartDishes, (item, cb) => {
            if (item.dish.id === dish.id)
              get = item;
            cb();
          }, () => {
            if (get) {
              CartDish.update({id: get.id}, {comment: comment}).exec((err) => {
                if (err) return cb({error: err});

                cart.next('CART').then(() => {
                  count(cart, () => {
                    cb(null, cart);
                  });
                }, err => {
                  cb(err);
                });
              });
            } else {
              return cb({error: 404});
            }
          });
        });
      });
    },
  },

  beforeCreate: count,

  returnFullCart: function (cart) {
    return new Promise((resolve, reject) => {
      Cart.findOne({id: cart.id}).populate('dishes').exec((err, cart) => {
        if (err) return reject(err);
        cart.count(cart, () => {

          CartDish.find({cart: cart.id}).populate('dish').exec((err, dishes) => {
            if (err) return reject(err);

            async.each(cart.dishes, (cartDish, cb) => {
              async.each(dishes, (dish, cb) => {
                const origDish = dish.dish;

                if (cartDish.id === dish.id) {
                  cartDish.dish = origDish;
                  async.eachOf(origDish.modifiers, (modifier, key, cb) => {
                    if (modifier.childModifiers && modifier.childModifiers.length > 0) {
                      Group.findOne({id: modifier.modifierId}).exec((err, group) => {
                        if (err) cb(err);
                        origDish.modifiers[key].group = group;

                        async.eachOf(modifier.childModifiers, function (modifier, key1, cb) {
                          Dish.findOne({id: modifier.modifierId}).exec((err, modifier1) => {
                            if (err) cb(err);

                            origDish.modifiers[key].childModifiers[key1].dish = modifier1;
                            return cb();
                          });
                        }, function (err) {
                          cartDish.dish = origDish;
                          return cb(err);
                        });
                      });
                    } else {
                      Dish.findOne({id: modifier.id}).exec((err, modifier1) => {
                        if (err) cb(err);

                        origDish.modifiers[key].dish = modifier1;
                        return cb();
                      });
                    }
                  }, function (err) {
                    cartDish.modifiers = dish.modifiers;
                    return cb(err);
                  });
                } else {
                  return cb();
                }
              }, function (err) {
                if (err) return cb(err);
                if (Array.isArray(cartDish.modifiers)) {
                  async.each(cartDish.modifiers, (modifier, cb) => {
                    Dish.findOne({id: modifier.id}).exec((err, dish) => {
                      if (err) return cb(err);

                      modifier.dish = dish;
                      cb();
                    });
                  }, function (err) {
                    cb(err);
                  });
                } else {
                  if (cartDish.modifiers) {
                    Dish.findOne({id: cartDish.modifiers.id}).exec((err, dish) => {
                      if (err) return cb(err);

                      cartDish.modifiers.dish = dish;
                      cb();
                    });
                  } else {
                    cb();
                  }
                }
              });
            }, function (err) {
              if (err) return reject(err);
              // msg = msg || {type: 'info', title: 'ok', body: ""};
              // if (msg.type === 'error')
              //   res.status(500);
              // // sails.log('r ', new Date().getTime());
              // return res.json({cart: cart, message: msg});
              return resolve(cart);
            });
          });
        });
      });
    });
  }
};

/**
 * Calculate count of dishes and modifiers in cart
 * @param values
 * @param next
 */
function count(values, next) {
  CartDish.find({cart: values.id}).populate('dish').exec((err, dishes) => {
    if (err) {
      sails.log.error(err);
      return next();
    }

    let cartTotal = 0;
    let dishesCount = 0;
    let uniqueDishes = 0;

    async.each(dishes, (dish, cb) => {
      Dish.findOne({id: dish.dish.id}).exec((err, dish1) => {
        if (err) {
          sails.log.error(err);
          return cb(err);
        }

        if (!dish1) {
          sails.log.error('Dish with id ' + dish.dish.id + ' not found!');
          return cb(err);
        }

        countDish(dish, dish => {
          if (dish.itemTotal)
            cartTotal += dish.itemTotal;
          cartTotal += dish.amount * dish1.price;
          dishesCount += dish.amount;
          uniqueDishes++;
          cb();
        });

      });
    }, err => {
      if (err)
        return next();
      values.cartTotal = cartTotal;
      values.dishesCount = dishesCount;
      values.uniqueDishes = uniqueDishes;

      next();
    });
  });
}

function countDish(dish, next) {
  CartDish.findOne({id: dish.id}).exec((err, dish) => {
    if (err) {
      sails.log.error(err);
      return next();
    }

    const modifs = dish.modifiers;

    dish.uniqueItems = 0;
    dish.itemTotal = 0;

    async.each(modifs, (m, cb) => {
      dish.uniqueItems += m.amount;
      Dish.findOne({id: m.id}).exec((err, m1) => {
        if (err) {
          sails.log.error(err);
          return next();
        }

        if (!m1) {
          sails.log.error('Dish with id ' + m.id + ' not found!');
          return next();
        }

        dish.itemTotal += m.amount * m1.price * dish.amount;
        cb();
      });
    }, () => {
      dish.save(err => {
        if (err) sails.log.error(err);
        next(dish);
      });
    });
  });
}
