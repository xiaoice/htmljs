mail = require './../lib/mail.js'
mustache = require 'mu2'
module.exports = 
  sendQAInvite:(qa,emails)->
    buffer = ""
    
    mustache.compileAndRender('./views/mail/qa-invite.html', qa)
    .on 'data',(c)->
       buffer += c.toString()
    .on 'end',()->
      mail({
        subject:qa.user_nick+" 在前端乱炖问答频道 邀请您回答问题",
        to:emails,
        html:buffer
      })
  sendCardComment:(source_user_nick,card)->
    if not card.email then return;
    buffer = ""
    card.source_user_nick = source_user_nick
    mustache.compileAndRender('./views/mail/card-comment.html', card)
    .on 'data',(c)->
      buffer += c.toString()
    .on 'end',()->
      mail({
        subject:source_user_nick+" 在 前端乱炖花名册 评论了你的名片",
        to:card.email,
        html:buffer
      })
  sendArticleComment:(source_user,article)->
    if not source_user.email then return;
    buffer = ""
    article.source_user = source_user
    mustache.compileAndRender('./views/mail/article-comment.html', article)
    .on 'data',(c)->
      buffer += c.toString()
    .on 'end',()->
      mail({
        subject:source_user.nick+" 在 前端乱炖 评论了你的原创文章",
        to:source_user.email,
        html:buffer
      })
  sendAnswer:(answer,question,card)->
    if not card.email then return;
    buffer = ""
    answer.title = question.title
    mustache.compileAndRender('./views/mail/qa-answer.html', answer)
    .on 'data',(c)->
      buffer += c.toString()
    .on 'end',()->
      mail({
        subject:answer.user_nick+" 在 前端乱炖 回答了你的提问",
        to:card.email,
        html:buffer
      })
  sendArticleRss:(article,emails)->
    buffer = ""
    console.log emails
    mustache.compileAndRender('./views/mail/article-rss.html', {id:article.id,title:article.title,html:article.html.substr(0,500)+"......"})
    .on 'data',(c)->
      buffer += c.toString()
    .on 'end',()->
      mail({
        subject:"前端乱炖专栏新文章："+article.title,
        bcc:emails,
        to:"xinyu198736@gmail.com",
        html:buffer
      })
  sendColumnNotify:(column,card,rsses)->
    buffer = ""
    mustache.compileAndRender('./views/mail/column-notify.html', column)
    .on 'data',(c)->
      buffer += c.toString()
    .on 'end',()->
      mail({
        subject:"您的专栏被订阅了，但是您已经超过5天没有更新了",
        to:card.email,
        html:buffer
      })