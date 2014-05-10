wechat = require 'wechat'
func_article = (__F 'article/article')
func_column = __F 'column'
func_topic = __F 'topic'
func_search = __F 'search'
d = "你好，欢迎使用前端乱炖公众号系统\n回复1查看最新原创文章，\n回复2查看最近更新专栏，\n回复3查看最新讨论，\n回复：\"搜索：关键词\"可以使用本站的搜索系统搜索信息。\n也欢迎偶尔调戏下小炖(๑╹∀╹๑)萌。"
module.exports.controllers = 
    "/api":
        get:wechat("xinyu198736",(req,res,next)->
            console.log req.query
            )
        "post":wechat('xinyu198736', (req, res, next)->
            info = req.weixin
            username = info.FromUserName
            message = if info.Content then info.Content else ""
            console.log req.weixin
            if message.length > 10
                res.send '0k'
            if info.Event == "subscribe" || message == "?"
                res.reply d
            else if message == "1"
                func_article.getAll 1,10,{is_publish:1,is_yuanchuang:1},"id desc",(error,articles)->
                    news = []
                    articles.forEach (a)->
                        news.push
                            title:a.title
                            description:a.title
                            picurl: if a.main_pic then a.main_pic else a.user_headpic
                            url:"http://www.html-js.com/article/"+a.id
                    res.reply news
            else if message == "2"
                func_column.getAll 1,7,{is_publish:1},"last_article_time desc,visit_count desc",(error,articles)->
                    news = []
                    articles.forEach (a)->
                        news.push
                            title:a.name
                            description:a.name
                            picurl:a.user_headpic
                            url:"http://www.html-js.com/article/column/"+a.id
                    res.reply news
            else if message == "3"
                func_topic.getAll 1,7,null,"last_comment_time desc,id desc",(error,articles)->
                    news = []
                    articles.forEach (a)->
                        news.push
                            title:a.title
                            description:a.title
                            picurl:a.user_headpic
                            url:"http://www.html-js.com/topic/"+a.id
                    res.reply news
            else if message.substr(0,2) == "搜索"
                func_search.query {"query":message.substr(3,message.length-1),"limit":7,"offset":0},(error,data)->
                    data = JSON.parse data
                    results = data.data
                    news = []
                    results.forEach (result)->
                        title = ""
                        if result.type == 'article'
                            title +='「专栏」'
                        else if result.type == 'card'
                            title +='「花名册」'
                        else if result.type == 'qa'
                            title +='「问题」'
                        else if result.type == 'topic'
                            title +='「话题」'
                        else if result.type == 'answer'
                            title +='「回答」'
                        else if result.type == 'blog'
                            title +='「站外博客」'
                          news.push
                            title:title+result.title.replace(/<[^>]*?>/g,"")
                            description:title+result.title.replace(/<[^>]*?>/g,"")
                            picurl:"http://www.html-js.com/assets/images/logo.png"
                            url:"http://www.html-js.com/"+result.type+"/"+result.id
                    if news.length == 0
                        res.reply '对不起，没有搜索到任何相关信息，尝试换一下关键字吧少年！'
                    else
                        res.reply news

            )
