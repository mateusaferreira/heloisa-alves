(() => {
  const panel=document.querySelector('#home-map-panel');if(!panel)return;
  const shell=document.querySelector('.home-browse'),viewButtons=[...document.querySelectorAll('[data-home-view]')];
  const locations=new Map((window.PROPERTY_MAP_LOCATIONS||[]).map(p=>[p.id,p]));
  const catalog=new Map((window.PROPERTY_CATALOG||[]).map(p=>[p.id,p]));
  const cards=[...document.querySelectorAll('[data-home-property]')];
  const selection=document.querySelector('#map-selection'),areaButton=document.querySelector('#map-search-area'),allButton=document.querySelector('#map-show-all'),state=document.querySelector('#map-status');
  const number=new Intl.NumberFormat('pt-BR'),money=value=>'R$ '+number.format(value);
  const short=value=>value>=1000000?'R$ '+(value/1000000).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' mi':'R$ '+number.format(value/1000)+' mil';
  const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  let map,layer,loadPromise,popup,active=false,blocked=false,selected=null,visibleIds=[],markers=[],groups=[],currentGroup=null;
  const mobile=matchMedia('(max-width:760px)'),placeholder=document.createComment('home-map-position');
  panel.before(placeholder);
  const fullscreen=document.createElement('dialog');fullscreen.className='home-map-dialog';fullscreen.setAttribute('aria-label','Buscar imóveis no mapa');document.body.append(fullscreen);
  const backButton=document.createElement('button');backButton.type='button';backButton.className='map-back-to-list';backButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg><span>Voltar para a lista</span>';panel.prepend(backButton);
  function mapFitOptions(maxZoom){
    return fullscreen.open?{paddingTopLeft:[45,120],paddingBottomRight:[45,(selection.hidden?0:selection.offsetHeight)+65],maxZoom,animate:false}:{paddingTopLeft:[55,45],paddingBottomRight:[55,45],maxZoom,animate:false};
  }
  function syncFullscreen(){
    if(active&&mobile.matches){
      if(popup)map?.closePopup(popup);
      if(!fullscreen.open){fullscreen.append(panel);document.body.classList.add('home-map-fullscreen');fullscreen.showModal();backButton.focus({preventScroll:true});
        if(!history.state?.homeMapFullscreen)history.pushState({...history.state,homeMapFullscreen:true},'',location.href);
      }
    }else{
      if(panel.parentNode===fullscreen)placeholder.after(panel);
      if(fullscreen.open)fullscreen.close();
      document.body.classList.remove('home-map-fullscreen');
      if(!mobile.matches&&history.state?.homeMapFullscreen){const state={...history.state};delete state.homeMapFullscreen;history.replaceState(state,'',location.href);}
    }
    if(map&&active){blocked=true;map.invalidateSize({pan:false});blocked=false;render(true);}
  }
  function returnToList(){const useBack=fullscreen.open&&history.state?.homeMapFullscreen;setView('list');document.querySelector('[data-home-view="map"]').focus({preventScroll:true});if(useBack)history.back();}
  backButton.onclick=returnToList;
  fullscreen.addEventListener('cancel',event=>{event.preventDefault();returnToList();});
  fullscreen.addEventListener('close',()=>{if(active&&mobile.matches&&!fullscreen.open)returnToList();});
  window.addEventListener('popstate',()=>{if(history.state?.homeMapFullscreen&&mobile.matches){if(!active)setView('map');}else if(fullscreen.open)setView('list');});
  mobile.addEventListener('change',syncFullscreen);
  function loadLibrary(){
    if(window.L)return Promise.resolve();
    if(!loadPromise)loadPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/leaflet/leaflet.js';script.onload=()=>window.L?resolve():reject();script.onerror=reject;document.head.append(script);});
    return loadPromise;
  }
  function highlight(group){for(const entry of markers){entry.marker.getElement()?.classList.toggle('is-selected',entry.group===group);entry.marker.setZIndexOffset(entry.group===group?1000:0);}}
  let deckSignature='',deckTimer,deckTarget=null,centerToken=0;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function propertyCard(id){
    const p=catalog.get(id),place=locations.get(id);
    const title=p.id.startsWith('casa-terra')?'Casa Terra Bonita':p.id.startsWith('casa-jardim')?'Casa Jardim Itatiaia 2':p.title;
    return `<a class="map-property-card" href="${escape(p.url)}"><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" width="128" height="100" draggable="false"><span class="map-property-copy"><strong>${escape(title)}${p.occupied?' · locado':''}</strong><span>${escape(p.neighborhood)}</span><span class="map-property-facts">${number.format(p.area)} m² · ${p.bedrooms} quartos · ${p.parking} ${p.parking===1?'vaga':'vagas'}</span><b>${money(p.price)}</b></span><span class="map-property-open">Ver imóvel</span></a>${place.approximate?'<p class="map-approximate">Localização aproximada na rua. Número sob consulta.</p>':''}`;
  }
  function centerProperty(id){
    const place=locations.get(id);if(!map||!place)return;
    const token=++centerToken;blocked=true;map.stop();
    const point=map.latLngToContainerPoint([place.lat,place.lng]),middle=map.getSize().divideBy(2);
    if(point.distanceTo(middle)<1){blocked=false;return;}
    map.once('moveend',()=>{if(token===centerToken)blocked=false;});
    map.panTo([place.lat,place.lng],{animate:!reducedMotion.matches,duration:.35});
  }
  function carousel(id,scrollToCard){
    const ids=visibleIds.filter(key=>catalog.has(key)&&locations.has(key)),signature=ids.join('|');
    selection.classList.add('is-carousel');
    if(signature!==deckSignature||!selection.querySelector('.map-card-track')){
      clearTimeout(deckTimer);deckTarget=null;deckSignature=signature;
      selection.innerHTML=`<p class="map-card-counter" role="status" aria-live="polite"></p><div class="map-card-track" tabindex="0" role="region" aria-roledescription="carrossel" aria-label="Imóveis no mapa. Deslize ou use as setas para trocar de imóvel.">${ids.map((key,index)=>`<div class="map-card-slide" data-map-slide="${escape(key)}" role="group" aria-roledescription="slide" aria-label="${index+1} de ${ids.length}">${propertyCard(key)}</div>`).join('')}</div>`;
      const track=selection.querySelector('.map-card-track');
      track.dataset.count=String(ids.length);
      const settle=()=>{
        if(!fullscreen.open||!track.isConnected)return;
        if(deckTarget!==null){if(Math.abs(track.scrollLeft-deckTarget)>2)return;deckTarget=null;}
        const pad=parseFloat(getComputedStyle(track).paddingLeft)||0;
        const nearest=[...track.children].reduce((best,slide)=>Math.abs(slide.offsetLeft-pad-track.scrollLeft)<Math.abs(best.offsetLeft-pad-track.scrollLeft)?slide:best);
        const key=nearest?.dataset.mapSlide;if(key&&key!==selected){const group=groups.find(g=>g.ids.includes(key));selectProperty(key,group,true,'swipe');}
      };
      track.addEventListener('scroll',()=>{clearTimeout(deckTimer);deckTimer=setTimeout(settle,100);},{passive:true});
      track.addEventListener('scrollend',settle);
      track.addEventListener('pointerdown',()=>{deckTarget=null;},{passive:true});
      track.addEventListener('touchstart',()=>{deckTarget=null;},{passive:true});
      track.addEventListener('wheel',()=>{deckTarget=null;},{passive:true});
      track.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const current=ids.indexOf(selected),index=event.key==='Home'?0:event.key==='End'?ids.length-1:Math.max(0,Math.min(ids.length-1,current+(event.key==='ArrowRight'?1:-1)));
        const key=ids[index];selectProperty(key,groups.find(g=>g.ids.includes(key)),true,'keyboard');
      });
      scrollToCard=true;
    }
    const track=selection.querySelector('.map-card-track'),slides=[...track.children],index=ids.indexOf(id);
    const counter=selection.querySelector('.map-card-counter'),label=ids.length===1?'1 imóvel encontrado':`${index+1} de ${ids.length} imóveis · Deslize para ver mais`;
    if(counter.textContent!==label)counter.textContent=label;
    for(const slide of slides){const current=slide.dataset.mapSlide===id;slide.classList.toggle('is-current',current);if(current)slide.querySelector('a').setAttribute('aria-current','true');else slide.querySelector('a').removeAttribute('aria-current');}
    if(scrollToCard&&index>=0){const pad=parseFloat(getComputedStyle(track).paddingLeft)||0;deckTarget=Math.max(0,Math.min(track.scrollWidth-track.clientWidth,slides[index].offsetLeft-pad));track.scrollTo({left:deckTarget,behavior:reducedMotion.matches?'auto':'smooth'});}
  }
  function selectProperty(id,group,pan=false,source='control'){
    const p=catalog.get(id),place=locations.get(id);if(!p||!place)return;
    group=groups.find(entry=>entry.ids.includes(id))||group;
    const changed=selected!==id;selected=id;currentGroup=group;
    if(fullscreen.open){
      if(changed&&source!=='render')render(false);
      group=groups.find(g=>g.ids.includes(id));currentGroup=group;highlight(group);
      selection.hidden=false;carousel(id,source!=='swipe'&&source!=='render');
      if(pan)centerProperty(id);
      return;
    }
    selection.classList.remove('is-carousel');highlight(group);
    const options=group.ids.length>1?`<div class="map-building-options" role="group" aria-label="${group.sites>1?'Imóveis nesta região':'Imóveis neste condomínio'}">${group.ids.map(key=>{const item=catalog.get(key);return `<button type="button" data-map-property="${escape(key)}" aria-pressed="${key===id}">${group.sites>1?escape(item.title)+' · ':''}${money(item.price)}${item.occupied?' · locado':''}</button>`;}).join('')}</div>`:'';
    selection.hidden=true;
    selection.innerHTML='';
    if(source==='control'){
      if(!popup)popup=L.popup({className:'property-map-popup',minWidth:230,maxWidth:320,autoPanPaddingTopLeft:[22,80],autoPanPaddingBottomRight:[22,30],closeButton:true});
      popup.setLatLng([place.lat,place.lng]).setContent(options+propertyCard(id)).openOn(map);
      const close=popup.getElement().querySelector('.leaflet-popup-close-button');if(close){close.setAttribute('aria-label','Fechar card do imóvel');close.title='Fechar card do imóvel';}
      for(const button of popup.getElement().querySelectorAll('[data-map-property]'))button.onclick=()=>selectProperty(button.dataset.mapProperty,group);
    }
    if(pan&&!map.getBounds().contains([place.lat,place.lng])){blocked=true;map.panTo([place.lat,place.lng],{animate:false});blocked=false;}
  }
  function render(resetView){
    if(!map)return;
    if(!visibleIds.includes(selected))selected=visibleIds.includes('maison-giverny')?'maison-giverny':visibleIds[0]||null;
    if(popup?.isOpen()&&!visibleIds.includes(popup.getElement()?.querySelector('.map-property-card')?.getAttribute('href')?.split('/').filter(Boolean).pop()))map.closePopup(popup);
    for(const item of markers)item.marker.remove();markers=[];groups=[];
    const grouped=new Map();
    for(const id of visibleIds){const place=locations.get(id),p=catalog.get(id);if(!place||!p)continue;const key=place.lat+','+place.lng;if(!grouped.has(key))grouped.set(key,{lat:place.lat,lng:place.lng,ids:[]});grouped.get(key).ids.push(id);}
    let focused=null;
    if(fullscreen.open&&selected){const place=locations.get(selected);focused={lat:place.lat,lng:place.lng,ids:[selected],sites:1};for(const group of grouped.values())group.ids=group.ids.filter(id=>id!==selected);}
    groups=[...grouped.values()].filter(g=>g.ids.length).map(g=>({...g,sites:1}));
    // Agrupa etiquetas próximas na escala atual, sem deslocar pins de endereços.
    let merged=true;
    while(merged){merged=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const a=map.latLngToContainerPoint([groups[i].lat,groups[i].lng]),b=map.latLngToContainerPoint([groups[j].lat,groups[j].lng]);
      if(Math.abs(a.x-b.x)<125&&Math.abs(a.y-b.y)<48){const first=groups[i],second=groups[j],sites=first.sites+second.sites;first.lat=(first.lat*first.sites+second.lat*second.sites)/sites;first.lng=(first.lng*first.sites+second.lng*second.sites)/sites;first.sites=sites;first.ids.push(...second.ids);groups.splice(j,1);merged=true;break outer;}
    }}
    if(focused)groups.push(focused);
    for(const group of groups){
      group.ids.sort((a,b)=>catalog.get(a).price-catalog.get(b).price);
      const p=catalog.get(group.ids[0]),multiple=group.ids.length>1;
      const icon=L.divIcon({className:'property-price-marker',html:`<button class="property-price-pin" type="button" aria-label="${escape(multiple?group.ids.length+' imóveis '+(group.sites>1?'nesta região':'no '+p.title)+', a partir de '+money(p.price):p.title+', '+money(p.price))}"><span>${short(p.price)}</span>${multiple?`<small>${group.ids.length}</small>`:''}</button>`,iconSize:[multiple?144:116,40],iconAnchor:[multiple?72:58,44]});
      const marker=L.marker([group.lat,group.lng],{icon,keyboard:false}).addTo(map);
      marker.on('click',()=>{selectProperty(group.ids.includes(selected)?selected:group.ids[0],group,fullscreen.open&&group.sites===1);if(group.sites>1){blocked=true;map.fitBounds(group.ids.map(id=>{const p=locations.get(id);return[p.lat,p.lng];}),mapFitOptions(17));blocked=false;}});markers.push({marker,group});
    }
    const chosen=groups.find(g=>g.ids.includes(selected))||groups.find(g=>g.ids.includes('maison-giverny'))||groups[0];
    if(chosen)selectProperty(chosen.ids.includes(selected)?selected:chosen.ids[0],chosen,false,'render');else{selection.hidden=true;selected=null;currentGroup=null;}
    state.hidden=groups.length>0;state.textContent=groups.length?'':'Nenhum imóvel nesta busca. Altere os filtros para ver outras opções.';
    if(resetView&&groups.length){blocked=true;map.invalidateSize({pan:false});map.fitBounds(visibleIds.map(id=>locations.get(id)).filter(Boolean).map(p=>[p.lat,p.lng]),mapFitOptions(16));blocked=false;areaButton.hidden=true;}
  }
  async function ensureMap(){
    if(map){map.invalidateSize({pan:false});return;}
    state.hidden=false;state.textContent='Carregando mapa…';
    try{
      await loadLibrary();
      if(!active||map)return;
      map=L.map('property-map',{scrollWheelZoom:true,touchZoom:true,zoomControl:false,attributionControl:true}).setView([-23.339,-51.173],14);
      L.control.zoom({position:'topright',zoomInTitle:'Aproximar mapa',zoomOutTitle:'Afastar mapa'}).addTo(map);
      layer=L.tileLayer(window.PROPERTY_MAP_TILES||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(map);
      let loadedTile=false;layer.on('tileerror',()=>{if(!loadedTile){state.hidden=false;state.textContent='O mapa está indisponível no momento. Você pode continuar pela Lista.';}});
      layer.on('tileload',()=>{loadedTile=true;if(visibleIds.length)state.hidden=true;});
      map.on('moveend',()=>{if(active&&!blocked)areaButton.hidden=false;});
      map.on('zoomend',()=>render(false));
      render(true);
    }catch{loadPromise=null;state.hidden=false;state.textContent='Não foi possível carregar o mapa. Continue pela Lista ou tente abrir Mapa novamente.';}
  }
  function setView(view){
    active=view==='map';shell.classList.toggle('has-map',active);panel.hidden=!active;if(!active&&popup)map?.closePopup(popup);
    for(const button of viewButtons)button.setAttribute('aria-pressed',String(button.dataset.homeView===view));
    syncFullscreen();
    if(active)ensureMap();
  }
  for(const button of viewButtons)button.onclick=()=>{setView(button.dataset.homeView);if(active&&!mobile.matches)document.querySelector('.home-filter-row').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  document.addEventListener('home:results',event=>{visibleIds=event.detail.ids;allButton.hidden=!event.detail.area;render(event.detail.resetView);});
  areaButton.onclick=()=>{const b=map.getBounds();areaButton.hidden=true;document.dispatchEvent(new CustomEvent('home:map-area',{detail:{south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()}}));};
  allButton.onclick=()=>document.dispatchEvent(new CustomEvent('home:map-area',{detail:null}));
  for(const card of cards){const id=card.querySelector('a').getAttribute('href').split('/').filter(Boolean).pop();const show=()=>{if(!active||!map||card.hidden)return;const group=groups.find(g=>g.ids.includes(id));if(group)selectProperty(id,group,true,'list');};card.addEventListener('mouseenter',show);card.addEventListener('focusin',show);}
  document.dispatchEvent(new CustomEvent('home:map-ready'));
})();
