xml=require 'js2xmlparser'
require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
search = require ("./../lib/search.coffee")
func_column = __F 'column'
func_article = __F 'article/article'
func_blog = __F 'blog/article'
queuedo = require 'queuedo'
data = {
  "@": {
    "xmlns": "http://www.google.com/schemas/sitemap/0.84"
  },
  "url":[]
}

func_article.getAll 1,5000,null,(error,articles)->
  queuedo articles,(article,next,context)->
    data.url.push({
      "loc":"http://www.html-js.com/article/"+article.pinyin,
      "lastmod":article.createdAt,
      "changefreq":"monthly",
      "priority":"1"
    })
    next.call(context)
  ,()->
    


    (__F 'topic').getAll 1,1000,null,(error,topics)->
      queuedo topics,(topic,next,context)->
        data.url.push({
          "loc":"http://www.html-js.com/topic/"+topic.id,
          "lastmod":topic.createdAt,
          "changefreq":"monthly",
          "priority":"1"
        })
        next.call(context)
      ,()->

        (__F 'question').getAll 1,1000,null,(error,qas)->
          queuedo qas,(qa,next,context)->
            data.url.push({
              "loc":"http://www.html-js.com/qa/"+qa.pinyin,
              "lastmod":qa.createdAt,
              "changefreq":"monthly",
              "priority":"1"
            })
            next.call(context)
          ,()->

            (__F 'card').getAll 1,10000,null,(error,cards)->
              queuedo cards,(card,next,context)->
                data.url.push({
                  "loc":"http://www.html-js.com/card/"+card.id,
                  "lastmod":card.createdAt,
                  "changefreq":"monthly",
                  "priority":"1"
                })
                next.call(context)
              ,()->
                (require 'fs').writeFileSync "sitemap.xml",(xml('urlset',data).replace("\n","").replace("\t","")),'utf-8'
