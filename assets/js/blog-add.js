var html = "<div class='wrapper'><form action='' method='post'>"+
"<div class=''></div>"+
"</form></div>";

$("*").on("mouseenter",function(e){
  $(this).css({
    border:"1px solid #aaa"
  })
}).on("mouseleave",function(e){
  $(this).css({
    border:"none"
  })
})