mail = require './../lib/mail.js'
mustache = require 'mu2'
config = require './../config.coffee'

buffer = ""

mustache.compileAndRender('./../views/mail/act1.html', {})
.on 'data',(c)->
   buffer += c.toString()
.on 'end',()->
  mail({
    subject:"杭JS国际大会650元门票免费送,欢迎参与抽奖！",
    #to:"xinyu198736@gmail.com",
    to:"weekly@htmljs.sendcloud.org",
    use_maillist:"true",
    api_user:config.mail.api_user_list,
    api_key: config.mail.api_key_list,
    html:buffer
  })

