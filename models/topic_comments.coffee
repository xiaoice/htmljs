module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  md:"text"
  html:
    type:"text"
    set:(v)->
      return this.setDataValue('html', xss(v));
  parent_id:"int"
  uuid:"varchar(40)"
  user_id:"int"
  user_nick:"varchar(40)"
  user_headpic:"varchar(255)"
  topic_id:"int"
  zan_count:
    type:"int"
    defaultValue:0