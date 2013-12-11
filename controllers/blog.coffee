func_article = __F 'blog/article'
func_blog = __F 'blog/blog'
moment = require 'moment'
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
                time:moment(req.body.time).valueOf()
              ,(error,article)->
                if error 
                  result.info = error.message
                else
                  func_blog.addCount req.body.blog_id,'article_count',()->
                  result.success = 1
                res.send result
  "/add-blog":
    get:(req,res,next)->

      res.render 'blog/add-blog.jade'
    post:(req,res,next)->
      func_blog.add req.body,(error,blog)->
        if error then next error
        else
          res.redirect '/blog'
module.exports.filters =
  "/":
    get:['freshLogin','blog/get-all-blogs','blog/get-all-articles']
  "/add-blog":
    get:['checkLogin','checkAdmin']
    post:['checkLogin','checkAdmin']