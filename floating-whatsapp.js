(() => {
  const links=[...document.querySelectorAll('.home-contact-inquiry,.mobile-actions a.whatsapp')];
  if(!links.length)return;
  const mobile=matchMedia('(max-width:760px)');
  let timer;
  for(const link of links){
    const label=document.createElement('span');label.className='floating-whatsapp-label';
    label.append(...[...link.childNodes].filter(node=>!(node.nodeType===1&&node.tagName.toLowerCase()==='svg')));
    link.append(label);link.classList.add('floating-whatsapp-button');
    link.setAttribute('aria-label','Tirar dúvidas pelo WhatsApp');link.title='Tirar dúvidas';
  }
  function schedule(){
    clearTimeout(timer);
    for(const link of links)link.classList.remove('is-compact');
    if(document.hidden)return;
    const animated=links.filter(link=>mobile.matches||link.matches('.home-contact-inquiry'));
    // Give the visitor time to read, then release the space to the left of the button.
    timer=setTimeout(()=>{for(const link of animated)if(!link.matches(':focus-visible'))link.classList.add('is-compact');},4500);
  }
  mobile.addEventListener('change',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else if(links.some(link=>!link.classList.contains('is-compact')))schedule();});
  schedule();
})();
