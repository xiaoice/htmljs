
module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  title:"varchar(300)"
  md:"text"
  html:
    type:"text"
    set:(v)->
      return this.setDataValue('html', xss(v));
  user_id:"int"
  user_headpic:"varchar(255)"
  user_nick:"varchar(50)"
  visit_count:
    type:"int"
    defaultValue:0
  answer_count:
    type:"int"
    defaultValue:0
  comment_count:
    type:"int"
    defaultValue:0
  is_answered:
    type:"tinyint"
    defaultValue:0
  is_hot:
    type:"tinyint"
    defaultValue:0
  sort:
    type:"int"
    defaultValue:0
  tagNames:"varchar(255)"
  uuid:"varchar(40)"
  good_answer_id:"int"
  is_closed:
    type:"tinyint"
    defaultValue:0
  is_admin: #是否是官方问题
    type:"tinyint"
    defaultValue:0
  is_jing:
    type:"tinyint"
    defaultValue:0
  pinyin:"varchar(1500)"
  channel_id:"int"