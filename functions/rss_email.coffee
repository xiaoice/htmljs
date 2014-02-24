Email = __M 'emails'
Email.sync()
func_email = new __BaseFunction(Email)
func_email.add = (data,callback)->
  Email.find
    where:
      email:data.email
  .success (e)->
    if e
      callback&&callback new Error '此邮箱已经订阅过'
    else
      Email.create(data)
      .success (m)->
        callback&&callback null,m
      .error (error)->
        callback&&callback error
  .error (e)->
    callback&&callback e
module.exports = func_email