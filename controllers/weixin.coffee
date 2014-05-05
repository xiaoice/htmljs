wechat = require 'wechat'
func_article = __FC 'article'
func_column = __FC 'column'
func_topic = __FC 'topic'
d = "你好，欢迎使用前端乱炖公众号系统\n回复1查看最新原创文章，回复2查看最近更新专栏，回复3查看最新讨论，其他内容作为搜索关键字返回搜索结果"
module.exports.controllers = 
    "/api":
        get:wechat("xinyu198736",(req,res,next)->
            console.log req.query
            )
        "post":wechat('xinyu198736', (req, res, next)->
            info = req.weixin
            username = info.FromUserName
            message = info.Content

            if message == "1"
                func_article.getAll 1,10,{is_publish:1,is_yuanchuang:1},"id desc",(error,articles)->
                    news = []
                    articles.forEach (a)->
                        news.push
                            title:a.title
                            description:a.title
                            picurl:a.main_pic
                            url:"http://www.html-js.com/article/"+a.id
                    res.reply news
            if message == "2"
                func_column.getAll 1,10,{is_publish:1},"last_article_time desc,visit_count desc",(error,articles)->
                    news = []
                    articles.forEach (a)->
                        news.push
                            title:a.title
                            description:a.title
                            picurl:a.user_headpic
                            url:"http://www.html-js.com/article/column/"+a.id
                    res.reply news
            )
