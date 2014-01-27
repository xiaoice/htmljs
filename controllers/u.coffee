func_url = __F 'url'
module.exports.controllers =
  "/add":
    get:(req,res,next)->
      if req.query.url
        func_url.getByPath req.query.url,(error,u)->
          if u
            res.send u
          else
            func_url.add
              path:req.query.url
            ,(error,u)->
              if error
                next error 
                return
              func_url.getUUSById u.id,(error,uus)->
                if error 
                  next error
                else
                  func_url.update u.id,{key:uus.key},(error,url)->
                    if error
                      next error
                    else
                      res.send url
      else
        next new Error '错误的参数'
  "/:id":
    get:(req,res,next)->
      func_url.getByKey req.params.id,(error,u)->
        if u
          func_url.addCount u.id,['visit_count']
          res.redirect u.path
        else
          next error

  
