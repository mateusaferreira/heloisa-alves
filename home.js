(() => {
  if(['#valor','#fotos','#detalhes','#caracteristicas','#localizacao'].includes(location.hash)){
    location.replace('/imoveis/maison-giverny/'+location.search+location.hash);return;
  }
  const input=document.querySelector('#property-search'),cards=[...document.querySelectorAll('[data-home-property]')];
  const filters=[...document.querySelectorAll('[data-filter]')],clear=document.querySelector('.home-search-clear'),empty=document.querySelector('.home-empty'),status=document.querySelector('.home-results');
  const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let kind='todos',area=null;
  const places=new Map((window.PROPERTY_MAP_LOCATIONS||[]).map(p=>[p.id,p]));
  const properties=new Map((window.PROPERTY_CATALOG||[]).map(p=>[p.id,p])),model=window.PropertyFilters;
  const idOf=card=>card.querySelector('a').getAttribute('href').split('/').filter(Boolean).pop();
  const list=document.querySelector('#home-properties'),sort=document.querySelector('#property-sort'),sortDialog=document.querySelector('#sort-dialog'),sortTrigger=document.querySelector('.home-sort-control'),originalOrder=new Map(cards.map((card,index)=>[card,index]));
  let sortOrder='featured';
  if(sort&&sortDialog&&sortTrigger){
    sortTrigger.addEventListener('click',()=>{sort.elements.order.value=sortOrder;sortDialog.showModal();sortTrigger.setAttribute('aria-expanded','true');sortDialog.querySelector('h2').focus({preventScroll:true});});
    sortDialog.querySelector('.sort-close').addEventListener('click',()=>sortDialog.close());
    sortDialog.addEventListener('close',()=>{sortTrigger.setAttribute('aria-expanded','false');sortTrigger.focus({preventScroll:true});});
    sortDialog.addEventListener('click',event=>{if(event.target!==sortDialog)return;const box=sortDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)sortDialog.close();});
    sort.addEventListener('submit',event=>{
      event.preventDefault();sortOrder=sort.elements.order.value;
      const labels={featured:'Mais relevantes',recent:'Mais recente','price-asc':'Menor preço','price-desc':'Maior preço','area-desc':'Maior área'};
      cards.sort((a,b)=>{const first=properties.get(idOf(a)),second=properties.get(idOf(b));let difference=0;
        if(sortOrder==='recent')difference=(Date.parse(second.publishedAt)||0)-(Date.parse(first.publishedAt)||0);
        if(sortOrder==='price-asc')difference=first.price-second.price;
        if(sortOrder==='price-desc')difference=second.price-first.price;
        if(sortOrder==='area-desc')difference=second.area-first.area;
        return difference||originalOrder.get(a)-originalOrder.get(b);
      });
      list.append(...cards);sortTrigger.setAttribute('aria-label','Ordenar por: '+labels[sortOrder]);sortTrigger.classList.toggle('is-sorted',sortOrder!=='featured');
      update(false);sortDialog.close();
    });
  }
  function update(resetView=true){
    if(model)kind=model.get().type;
    const terms=normalize(input.value).split(/\s+/).filter(Boolean);let count=0;const ids=[];
    for(const card of cards){const text=normalize(card.dataset.search),id=idOf(card),place=places.get(id);const inArea=!area||(place&&place.lat>=area.south&&place.lat<=area.north&&place.lng>=area.west&&place.lng<=area.east);const visible=(kind==='todos'||card.dataset.kind===kind)&&(!model||model.matches(properties.get(id)))&&terms.every(term=>text.includes(term))&&inArea;card.hidden=!visible;if(visible){count++;ids.push(id);}}
    status.textContent=count+(count===1?' imóvel':' imóveis');empty.hidden=count!==0;clear.hidden=!input.value;
    for(const filter of filters)filter.setAttribute('aria-pressed',String(filter.dataset.filter===kind));
    document.dispatchEvent(new CustomEvent('home:results',{detail:{ids,resetView,area:!!area}}));
  }
  input.addEventListener('input',()=>{area=null;update();});
  document.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();update();input.blur();});
  for(const filter of filters)filter.addEventListener('click',()=>{kind=filter.dataset.filter;area=null;if(!model||!model.set({type:kind}))update();});
  clear.addEventListener('click',()=>{input.value='';area=null;update();input.focus();});
  document.querySelector('.home-reset').addEventListener('click',()=>{input.value='';kind='todos';area=null;if(!model||!model.set(model.defaults))update();input.focus();});
  document.addEventListener('property:filters-changed',()=>{area=null;update();});
  document.addEventListener('home:map-ready',()=>update());
  document.addEventListener('home:map-area',event=>{area=event.detail;update(!area);});
  const syncGeneralInquiry=()=>{if(!window.PropertyMessages?.general)return;const href='https://wa.me/5543988318811?text='+encodeURIComponent(window.PropertyMessages.general());for(const link of document.querySelectorAll('.home-contact-inquiry,a.whatsapp'))link.href=href;};
  syncGeneralInquiry();window.addEventListener('pageshow',syncGeneralInquiry);
  update();
})();
