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
