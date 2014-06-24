func_coin = __F 'coin'

module.exports =  (req,res,next)->
    func_coin.getWeekTop (error,users)->
        res.locals.weekTopUsers = users
        next()