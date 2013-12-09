module.exports = (req,res,next)->
  (__F 'card').getById req.params.id,(error,card)->
    if error then next error
    else if not card then next new Error '不存在的名片'
    else  
      res.locals.card = card
      (__F 'user').getById card.user_id,(error,user)->
        res.locals.card_user = user
        next()