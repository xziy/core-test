// noinspection JSUnusedGlobalSymbols
/**
 * Cart.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    cartId: {
      type: 'string'
    },
    dishes: {
      collection: 'cartDish',
      via: 'cart'
    },
    countDishes: {
      type: 'integer'
    },
    uniqueDishes: {
      type: 'integer'
    },
    cartTotal: {
      type: 'integer'
    },

    /**
     * Add dish in cart
     * @param dish - dish object
     * @param amount
     * @param cb
     * @returns {error, cart}
     */
    addDish: function (dish, amount, cb) {
      if (dish.balance !== -1)
        if (amount > dish.balance)
          return cb({error: 'There is no so mush dishes ' + dish.id});

      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.find({cart: cart.id}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});

          let get = null;
          cartDishes.forEach(item => {
            if (item.dish.id === dish.id)
              get = item;
          });

          if (get) {
            get.amount += parseInt(amount);
            CartDish.update({id: get.id}, {amount: get.amount}).exec((err) => {
              if (err) return cb({error: err});

              cb(null, cart);
            });
          } else {
            CartDish.create({dish: dish.id, cart: this.id, amount: parseInt(amount)}).exec((err) => {
              if (err) return cb({error: err});

              cb(null, cart);
            });
          }
        });
      });
    },

    /**
     * Remove dish from cart
     * @param dishId
     * @param amount
     * @param cb
     * @return {error, cart}
     */
    removeDish: function (dishId, amount, cb) {
      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.find({cart: cart.id}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});

          let get = null;
          cartDishes.forEach(item => {
            if (item.dish.id === dishId)
              get = item;
          });

          if (get) {
            get.amount -= parseInt(amount);
            if (get.amount > 0) {
              CartDish.update({id: get.id}, {amount: get.amount}).exec((err) => {
                if (err) return cb({error: err});

                return cb(null, cart);
              });
            } else {
              get.destroy();
              return cb(null, cart);
            }
          } else {
            return cb({error: 404});
          }
        });
      });
    },

    /**
     * Add modifier in dish in this cart
     * @param dishId
     * @param modifier - modifier object
     * @param amount
     * @param cb
     * @return {error, cart}
     */
    addModifier: function (dishId, modifier, amount, cb) {
      if (modifier.balance !== -1)
        if (amount > modifier.balance)
          return cb({error: 'There is no so mush dishes ' + modifier.id});

      CartDish.find({cart: this.id}).populate(['dish', 'modifiers']).exec((err, cartDishes) => {
        if (err) return cb({error: err});

        // dish that in cart and is required from user
        let get = null;
        cartDishes.forEach(item => {
          if (item.dish.id === dishId)
            get = item;
        });

        const that = this;

        function createCartDishIfNeed(cartDish, cb) {
          if (cartDish) {
            cb(null, cartDish);
          } else {
            CartDish.create({cart: that.id, amount: 1, dish: dishId}).exec((err, cartDish) => {
              if (err) cb(err);

              cb(null, cartDish);
            });
          }
        }

        createCartDishIfNeed(get, (err, get) => {
          if (err) return cb({error: err});

          Dish.findOne({id: dishId}).populate('modifiers').exec((err, dish) => {
            if (err) return cb({error: err});

            sails.log.debug(modifier.id);

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
                get2.amount += parseInt(amount);

                CartDish.update({id: get2.id}, {amount: get2.amount}).exec((err) => {
                  if (err) return cb({error: err});

                  countDish(get, function () {
                    return cb(null, this);
                  });
                });
              } else {
                CartDish.create({dish: modifier.id, amount: parseInt(amount), parent: get.id}).exec((err) => {
                  if (err) return cb({error: err});

                  countDish(get, function () {
                    return cb(null, this);
                  });
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
     * Remove modifier from dish from this cart
     * @param dish
     * @param modifier
     * @param amount
     * @param cb
     * @return {error, cart}
     */
    removeModifier: function (dish, modifier, amount, cb) {
      CartDish.find({cart: this.id}).populate(['dish', 'modifiers']).exec((err, cartDishes) => {
        if (err) return cb({error: err});

        // dish that in cart and is required from user
        let get = null;
        cartDishes.forEach(item => {
          if (item.dish.id === dish)
            get = item;
        });
        sails.log.debug('GET', get);

        if (get) {
          Dish.findOne({id: dish}).populate('modifiers').exec((err, dish) => {
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
              sails.log.debug('GET2', get2);

              if (get2) {
                get2.amount -= parseInt(amount);

                if (get.amount > 0) {
                  CartDish.update({id: get2.id}, {amount: get2.amount}).exec((err) => {
                    if (err) return cb({error: err});

                    countDish(get, function () {
                      return cb(null, this);
                    });
                  });
                } else {
                  get.destroy();
                  return cb(null, this);
                }
              } else {
                return cb({error: 404});
              }
            } else {
              return cb({error: 404});
            }
          });
        } else {
          return cb({error: 404});
        }
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
      if (dish.balance !== -1)
        if (amount > dish.balance)
          return cb({error: 'There is no so mush dishes ' + dish.id});

      Cart.findOne({id: this.id}).populate('dishes').exec((err, cart) => {
        if (err) return cb({error: err});

        CartDish.find({cart: cart.id}).populate('dish').exec((err, cartDishes) => {
          if (err) return cb({error: err});

          let get = null;
          cartDishes.forEach(item => {
            if (item.dish.id === dish.id)
              get = item;
          });

          if (get) {
            get.amount = parseInt(amount);
            CartDish.update({id: get.id}, {amount: get.amount}).exec((err) => {
              if (err) return cb({error: err});

              cb(null, cart);
            });
          } else {
            return cb({error: 404});
          }
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

        Dish.findOne({id: dishId}).populate('modifiers').exec((err, dish) => {
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
    }
  },

  beforeCreate: count
};

/**
 * Calculate count of dishes and modifiers in cart
 * @param values
 * @param next
 */
function count(values, next) {
  CartDish.find({cart: values.id}).populate('modifiers', 'dish').exec((err, dishes) => {
    if (err) {
      sails.log.error(err);
      return next();
    }

    let cartTotal = 0;
    let dishesCount = 0;
    let uniqueDishes = 0;

    async.each(dishes, (dish, cb) => {
      Dish.findOne({id: dish.dish}).exec((err, dish1) => {
        if (err) {
          sails.log.error(err);
          return next();
        }

        if (!dish1) {
          sails.log.error('Dish with id ' + dish.dish + ' not found!');
          return next();
        }

        if (dish.itemTotal)
          cartTotal += dish.itemTotal;
        cartTotal += dish.amount * dish1.price;
        dishesCount += dish.amount;
        uniqueDishes++;
        cb();
      });
    }, () => {
      values.cartTotal = cartTotal;
      values.dishesCount = dishesCount;
      values.uniqueDishes = uniqueDishes;
      next();
    });
  });
}

function countDish(dish, next) {
  CartDish.findOne({id: dish.id}).populate('modifiers').exec((err, dish) => {
    if (err) {
      sails.log.error(err);
      return next();
    }

    CartDish.find({parent: dish.id}).populate('dish').exec((err, modifs) => {
      if (err) {
        sails.log.error(err);
        return next();
      }

      if (!dish.uniqueItems)
        dish.uniqueItems = 0;
      if (!dish.itemTotal)
        dish.itemTotal = 0;

      async.each(modifs, (m, cb) => {
        dish.uniqueItems += m.amount;
        dish.itemTotal += m.amount * m.dish.price;
        cb();
      }, () => {
        dish.save(err => {
          if (err) sails.log.error(err);
          next(dish);
        });
      });
    });
  });
}
