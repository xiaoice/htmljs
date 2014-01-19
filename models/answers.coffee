module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  md:"text"
  html:"text"
  question_id:
    type:"int"
  user_id:
    type: "int",
    references: "cards"
    referencesKey: "user_id"
  user_headpic:"varchar(255)"
  user_nick:"varchar(50)"
  zan_count:
    type:"int"
    defaultValue:0
  comment_count:
    type:"int"
    defaultValue:0
  sort:
    type:"int"
    defaultValue:0
  is_unused:
    type:"tinyint"
    defaultValue:0
