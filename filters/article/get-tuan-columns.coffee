module.exports = (req,res,next)->
  (__F 'column').getAll 1,100,{is_tuan:1},null,null,(error,columns)->
    res.locals.tuan_columns = columns
    next()