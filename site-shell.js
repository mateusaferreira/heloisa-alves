(() => {
 const trigger=document.querySelector('.site-menu-toggle'),menu=document.querySelector('#site-menu');
 if(!trigger||!menu)return;
 const close=menu.querySelector('.site-menu-close');let navigating=false;
 trigger.addEventListener('click',()=>{
   if(document.querySelector('dialog[open]'))return;
   navigating=false;menu.showModal();document.body.classList.add('site-menu-open');trigger.setAttribute('aria-expanded','true');close.focus({preventScroll:true});
 });
 close.addEventListener('click',()=>menu.close());
 menu.addEventListener('click',event=>{
   if(event.target.closest('a')){navigating=true;menu.close();return;}
   if(event.target!==menu)return;
   const bounds=menu.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)menu.close();
 });
 menu.addEventListener('close',()=>{document.body.classList.remove('site-menu-open');trigger.setAttribute('aria-expanded','false');if(!navigating)trigger.focus({preventScroll:true});});
})();
