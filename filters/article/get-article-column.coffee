module.exports = (req,res,next)->
  (__F 'column').getById res.locals.article.column_id,(error,column)->
    res.locals.column = column
    next()