(()=>{
  const sheet=document.querySelector('#offer-kind-dialog');
  let drag=null,restoreTimer;
  function clear(){clearTimeout(restoreTimer);drag=null;sheet.style.removeProperty('transform');sheet.style.removeProperty('transition');sheet.style.removeProperty('animation')}
  function finish(cancelled=false){
    if(!drag)return;
    const gesture=drag;drag=null;
    const elapsed=Math.max(1,performance.now()-gesture.time);
    if(!cancelled&&(gesture.distance>85||(gesture.distance>30&&gesture.distance/elapsed>.55))){sheet.close();return}
    sheet.style.transition=matchMedia('(prefers-reduced-motion: reduce)').matches?'none':'transform 180ms ease-out';
    sheet.style.removeProperty('transform');
    restoreTimer=setTimeout(()=>sheet.style.removeProperty('transition'),190);
  }
  sheet.addEventListener('pointerdown',event=>{
    if(!matchMedia('(max-width: 760px)').matches||!event.target.closest('.sheet-grabber')||(event.pointerType==='mouse'&&event.button!==0))return;
    event.preventDefault();clearTimeout(restoreTimer);
    drag={id:event.pointerId,start:event.clientY,time:performance.now(),distance:0};
    sheet.style.animation='none';sheet.style.transition='none';
    sheet.setPointerCapture(event.pointerId);
  });
  sheet.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    event.preventDefault();drag.distance=Math.max(0,event.clientY-drag.start);
    sheet.style.transform=`translateY(${drag.distance}px)`;
  });
  sheet.addEventListener('pointerup',event=>{if(drag?.id===event.pointerId){event.preventDefault();finish()}});
  sheet.addEventListener('pointercancel',()=>finish(true));
  sheet.addEventListener('lostpointercapture',()=>finish(true));
  sheet.addEventListener('close',clear);
  window.addEventListener('resize',()=>finish(true));
})();
