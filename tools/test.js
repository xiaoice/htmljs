"use strict";
function f2(){
   "use strict"; // see strict mode
   this = 'haha';
   return this;
 }

 console.log(f2())