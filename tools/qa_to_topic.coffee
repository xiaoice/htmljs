require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
global.xss = require 'xss'
xss.whiteList['iframe'] = ['src', 'width','height','allowfullscreen','frameborder','id','class','style'];

func_topic = __F 'topic'
func_topic_comment = __F 'topic_comment'
queuedo = require 'queuedo'
func_question = __F 'question'
func_answer = __F 'answer'
func_question.getAll 1,10000,null,"id asc",(error,questions)->
    console.log questions
    queuedo questions,(qa,next,context)->
        func_topic.add 
            uuid:qa.uuid
            title:qa.title
            md:qa.md
            html:qa.html
            visit_count:qa.visit_count
            comment_count:0
            user_id:qa.user_id
            user_nick:qa.user_nick
            user_headpic:qa.user_headpic
            pinyin:qa.pinyin
            last_comment_time:qa.updatedAt
        ,(error,topic)->
            func_answer.getByQuestionId qa.id,1,1000,null,(error,answers)->
                if not answers
                    next.call(context)
                else
                    comment_count = answers.length
                    queuedo answers,(ans,next1,context1)->
                        func_topic_comment.add 
                            md:ans.md
                            html:ans.html
                            uuid:ans.uuid
                            user_id:ans.user_id
                            user_nick:ans.user_nick
                            user_headpic:ans.user_headpic
                            topic_id:topic.id
                            zan_count:ans.zan_count
                        ,(error,c)->

                        func_answer.getCommentsByAnswerId ans.id,(error,comments)->
                            if comments
                                comment_count +=comments.length
                                comments.forEach (comment)->
                                    func_topic_comment.add 
                                        md:comment.content.replace(/<[^>]*?>/g,"")
                                        html:"<a href='/user/"+ans.user_id+"'>@"+ans.user_nick+" </a> "+comment.content
                                        user_id:comment.user_id
                                        user_nick:comment.user_nick
                                        topic_id:topic.id
                                    ,(error,c)->
                            func_topic.update topic.id,{comment_count:comment_count}
                            next1.call(context1)

                    ,()->
                        next.call(context)
    ,()->
        console.log 'end'
                                