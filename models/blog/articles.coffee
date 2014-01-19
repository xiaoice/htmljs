module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  blog_id:"int"
  uuid:"varchar(40)"
  url:"varchar(1000)"
  title:"varchar(200)"
  content:"text"
  desc:"text"
  visit_count:
    type:"int"
    defaultValue:0
  user_id:"int"
  time:"varchar(40)"