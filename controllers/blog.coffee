func_article = __F 'blog/article'
func_blog = __F 'blog/blog'
moment = require 'moment'
func_search = __F 'search'
module.exports.controllers = 
  "/":
    get:(req,res,next)->

      res.render 'blog/index.jade'
  "/add-article":
    get:(req,res,next)->
      res.end 'ok'
    post:(req,res,next)->
      result = 
        success:0
        info:''
      console.log req.body
      if !req.body.time || !req.body.title || !req.body.content
        result.info = "error"
        res.send result
      else
        func_blog.getById req.body.blog_id,(e,blog)->
          if e
            result.info = e.message
            res.send result
          else
            func_article.getByUrl req.body.url,(error,article)->
              if article
                result.info = "error"
                res.send result
              else
                func_article.add
                  blog_id:req.body.blog_id
                  title:req.body.title.replace(/<[^>]*?>/g,"")
                  content:req.body.content
                  user_id:blog.user_id
                  url:req.body.url
                  time:moment(req.body.time.replace(/年|月/g,'-').replace(/日/g,'')).valueOf()
                ,(error,article)->
                  if error 
                    result.info = error.message
                  else
                    func_blog.addCount req.body.blog_id,'article_count',()->
                    result.success = 1
                    func_search.add {type:"blog","pid":article.uuid,"title":article.title,"html":article.content.replace(/<[^>]*>/g,""),"udid":article.uuid,"id": article.id},()->
                  res.send result
  "/add-blog":
    get:(req,res,next)->

      res.render 'blog/add-blog.jade'
    post:(req,res,next)->
      func_blog.add req.body,(error,blog)->
        if error then next error
        else
          res.redirect '/blog'
  #参数
  "/add-one":
    post:(req,res,next)->
      result = 
        success:0
        info:""
      func_article.add req.body,(error,article)->
        if error
          res.send 'hihihi('+JSON.stringify(result)+')'
        else
          result.success = 1
          res.send 'hihihi('+JSON.stringify(result)+')'
  "/:id":
    get:(req,res,next)->
      func_article.getById req.params.id,(error,blog)->
        if error then next error
        else
          res.locals.blog = blog
          func_article.addCount req.params.id,'visit_count',()->
          res.render 'blog/jump.jade'
module.exports.filters =
  "/":
    get:['freshLogin','blog/get-all-blogs','blog/get-all-articles']
  "/add-blog":
    get:['checkLogin','checkAdmin']
    post:['checkLogin','checkAdmin']