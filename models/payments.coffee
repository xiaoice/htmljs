module.exports = 
  id:"int"
  uuid:"varchar(40)"
  trade_num:"varchar(100)"
  trade_title:"varchar(200)"
  target_uuid:"varchar(40)"
  trade_price:"double"
  target_type:"int" # 1 报名活动
  target_user_id:"int" # 付款者
  alipay_tradenum:"varchar(100)"
  status: #1 创建 2已付，等待确认收货 3已完成付款 4 确认收货
    defaultValue:1
    type:"int"
  buyer_email:"varchar(100)"
  pay_time:"datetime"
  buyer_id:"varchar(40)"
  trade_no:"varchar(40)"