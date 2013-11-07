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
