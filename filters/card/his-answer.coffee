module.exports = (req,res,next)->
  if not res.locals.card then next()
  else
    user_id = res.locals.card.user_id
    (__F 'answer').count {user_id:user_id},(error,count)->
      res.locals.his_answers_count = count
      (__F 'answer').getAllWithQuestion 1,10,{user_id:user_id},null,(error,answers)->
        res.locals.his_answers = answers
        next()