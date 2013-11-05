alipay = require('./../alipay_config').alipay
AlipayNotify = require('./../alipay_config').AlipayNotify
func_payment = __F 'payment'
func_act = __F 'act'
func_user = __F 'user'
module.exports.controllers = 
  "/create":
    get:(req,res,next)->
      # data = 
      #   out_trade_no:"123"#req.body.WIDout_trade_no 
      #   subject:"付款"#req.body.WIDsubject 
      #   total_fee:"1.0"#req.body.WIDtotal_fee 
      #   body: "111111111111111111"#req.body.WIDbody
      #   show_url:"http://www.html-js.com"#req.body.WIDshow_url

      # alipay.create_direct_pay_by_user(data, res)
      func_payment.getByTradeNum req.query.trade_num,(error,payment)->
        if error then next error
        else
          data = 
            out_trade_no:payment.trade_num#req.body.WIDout_trade_no 
            subject:payment.trade_title#req.body.WIDsubject 
            total_fee:payment.trade_price#req.body.WIDtotal_fee 
            body: payment.trade_title#req.body.WIDbody
            show_url:"http://www.html-js.com/act/"+payment.target_uuid#req.body.WIDshow_url
            quantity  : "1"#req.body.WIDquantity,
            payment_type:"1"
            price:payment.trade_price
            logistics_fee : "0"#req.body.WIDlogistics_fee,
            logistics_type  : "POST"#req.body.WIDlogistics_type,
            logistics_payment : "SELLER_PAY"#req.body.WIDlogistics_payment,
            # receive_name  : "芋头"#req.body.WIDreceive_name,
            # receive_address : "呵呵我是孙信宇"#req.body.WIDreceive_address,
            # receive_zip : "123456"#req.body.WIDreceive_zip,
            # receive_mobile  : "15967171060"#req.body.WIDreceive_mobile      
          alipay.trade_create_by_buyer(data, res);
  "/trade_create_by_buyer/notify_url":
    post:(req,res,next)->
      console.log req.body
      alipayNotify = new AlipayNotify(alipay.alipay_config);
      alipayNotify.verifyReturn req.body, (verify_result)->
        if verify_result
          if req.body.trade_status == 'WAIT_SELLER_SEND_GOODS'
            func_payment.getByTradeNum req.body.out_trade_no,(error,payment)->
              if error then res.end 'fail'
              else
                payment.updateAttributes
                  status:2
                  buyer_email:req.body.buyer_email
                  pay_time:new Date()
                .success ()->
                  func_user.getById payment.target_user_id,(error,user)->
                    if error then res.end 'fail'
                    else
                      func_act.addJoiner payment.target_uuid,user,(error,joiner)->
                        if error 
                          result.info = error.message
                          res.end 'fail'
                        else
                          res.end 'success'
                .error ()->
                  res.end 'fail'
        else
          res.end 'fail'

      
    get:(req,res,next)->
      console.log req.query
  "/trade_create_by_buyer/return_url":
    get:(req,res,next)->