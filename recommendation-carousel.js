(() => {
  for(const carousel of document.querySelectorAll('.recommendations-carousel')){
    const list=carousel.querySelector('.recommendations-list'),previous=carousel.querySelector('.recommendations-prev'),next=carousel.querySelector('.recommendations-next');
    if(!list||!previous||!next)continue;
    function update(){previous.disabled=list.scrollLeft<=2;next.disabled=list.scrollLeft+list.clientWidth>=list.scrollWidth-2;}
    function move(direction){
      const first=list.querySelector('li');if(!first)return;
      const gap=parseFloat(getComputedStyle(list).columnGap)||15;
      list.scrollBy({left:direction*(first.getBoundingClientRect().width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
    previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
    list.addEventListener('scroll',update,{passive:true});
    new ResizeObserver(update).observe(list);
    update();
  }
})();
