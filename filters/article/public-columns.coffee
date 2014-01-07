module.exports = (req,res,next)->
  (__F 'column').getAll 1,100,{is_public:1},"last_article_time desc,visit_count desc",(error,columns)->
    res.locals.public_columns = columns
    next()
