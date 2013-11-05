Trade = __M 'payments'
Trade.sync()
func_payment = 
  getByTradeNum:(trade_num,callback)->
    Trade.find
      where:
        trade_num:trade_num
    .success (payment)->
      if not payment
        callback new Error '不存在的订单'
      else if payment.status != 1
        callback new Error '订单已经被支付'
      else
        callback null,payment
    .error (e)->
      callback e

__FC func_payment,Trade,['get','add','update','delte']

module.exports = func_payment