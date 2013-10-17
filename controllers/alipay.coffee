alipay = require('./../alipay_config').alipay

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

      data = 
        out_trade_no:"U03745-131011-03873"#req.body.WIDout_trade_no 
        subject:"前端乱炖活动报名"#req.body.WIDsubject 
        total_fee:"1"#req.body.WIDtotal_fee 
        body: "前端乱炖活动报名"#req.body.WIDbody
        show_url:"www.html-js.com"#req.body.WIDshow_url
        quantity  : "1"#req.body.WIDquantity,
        payment_type:"1"
        price:"1"
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
  "/trade_create_by_buyer/return_url":
    get:(req,res,next)->