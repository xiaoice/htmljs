module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  uuid:"varchar(40)"
  user_id:"int"
  user_nick:"varchar(100)"
  user_headpic:"varchar(100)"
  md:"text"
  html:"text"
  time:"bigint"
  