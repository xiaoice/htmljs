CoinHistory = __M 'coin_history'
User = __M 'users'
User.hasOne CoinHistory,{foreignKey:"user_id"}
CoinHistory.belongsTo User,{foreignKey:"user_id"}
CoinHistory.sync()
moment = require 'moment'
weekCache = {}
func_coin = 
  add:(count,user_id,reason,callback)->
    CoinHistory.findAll
      where:
        user_id:user_id
        day:(new Date()).getTime()/1000/60/60/24
      raw:true
    .success (his)->
      if his 
        total = 0
        his.forEach (h)->
          total+=h.step
        if total>__C.day_coin_max
          callback&&callback new Error '已经达到本日最高积分（'+__C.day_coin_max+'）'
        else
          User.find
            where:
              id:user_id
          .success (u)->
            if u
              u.updateAttributes
                coin:u.coin*1+count

          CoinHistory.create
            user_id:user_id
            step:count
            day:(new Date()).getTime()/1000/60/60/24
            reason:reason
          .success (his)->
            callback&&callback null,his
          .error (e)->
            callback&&callback e
    .error (e)->
      callback&&callback e
  getWeekTop:(callback)->
    nowWeek = moment().format("YYYY-ww")
    dayofweek = moment().format("d")*1
    data = {}
    if weekCache[nowWeek]
      callback null,weekCache[nowWeek]
    else
      CoinHistory.findAll
        where:
          day:{gt:((new Date()).getTime()/1000/60/60/24-dayofweek),lt:200000}
        raw:true
        include:[User]
      .success (his)->
        his.forEach (h)->
          if data[h.user_id]
            data[h.user_id]+=h.step
          else
            data[h.user_id]=h.step
        console.log data
        weekCache[nowWeek] = data
        callback null,data
      .error (e)->
        callback e
__FC func_coin,CoinHistory,['getAll','count']
module.exports = func_coin