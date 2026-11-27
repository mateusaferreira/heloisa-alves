const $=s=>document.querySelector(s);
const config=window.SITE_CONFIG||{};
const notice=$('#notice');
function showNotice(title,text){$('#notice-title').textContent=title;$('#notice-text').textContent=text;notice.showModal()}
$('#close-notice').onclick=$('#notice-ok').onclick=()=>notice.close();
notice.addEventListener('click',e=>{if(e.target===notice){const r=notice.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)notice.close()}});
let phone=(config.whatsapp||'').replace(/\D/g,'');
if(phone.length===10||phone.length===11)phone='55'+phone;
document.querySelectorAll('a.whatsapp').forEach(a=>{if(/^55\d{10,11}$/.test(phone)){a.href='https://wa.me/'+phone+'?text='+encodeURIComponent(window.PropertyMessages.inquiry());a.target='_blank';a.rel='noopener noreferrer'}else a.addEventListener('click',e=>{e.preventDefault();showNotice('Atendimento em breve','O atendimento pelo WhatsApp está sendo preparado. Volte em breve para conversar sobre este imóvel.')})});
document.querySelectorAll('.group-link').forEach(a=>{if(/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+(?:\?.*)?$/.test(config.groupUrl||'')){a.href=config.groupUrl;a.target='_blank';a.rel='noopener noreferrer'}else a.addEventListener('click',e=>{e.preventDefault();showNotice('Um convite para boas oportunidades','O grupo de oportunidades está sendo preparado. Em breve, o convite estará disponível aqui.')})});
if(config.creci){document.querySelectorAll('#creci,[data-creci]').forEach(el=>{el.textContent='CRECI '+config.creci;el.hidden=false})}

function selectTab(id){['street','map'].forEach(k=>{const selected=k===id;$('#'+k+'-tab').setAttribute('aria-selected',String(selected));$('#'+k+'-tab').tabIndex=selected?0:-1;$('#'+k+'-panel').hidden=!selected});const f=$('#'+id+'-panel iframe');if(f.dataset.src){f.src=f.dataset.src;delete f.dataset.src}}
if($('#street-tab')&&$('#map-tab'))['street','map'].forEach(k=>{$('#'+k+'-tab').onclick=()=>selectTab(k);$('#'+k+'-tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();let id=e.key==='Home'?'street':e.key==='End'?'map':k==='street'?'map':'street';selectTab(id);$('#'+id+'-tab').focus()}}});
let toastTimer;function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
$('#share').onclick=async()=>{const url=location.href.split('#')[0],data=window.PROPERTY_PAGE||{},title=(data.title||'Maison Giverny')+' | Heloísa Alves',text=data.shareText||'110 m², 2 quartos e 2 vagas na Gleba Palhano. Conheça o Maison Giverny.';try{if(navigator.share){await navigator.share({title,text,url})}else{await navigator.clipboard.writeText(url);toast('Link do imóvel copiado!')}}catch(e){if(e.name!=='AbortError')showNotice('Compartilhe este imóvel','Copie o endereço desta página na barra do navegador e envie para quem você quiser.')}};

const featuresToggle=$('#features-toggle'),featuresExtra=$('#features-extra');
featuresToggle.onclick=()=>{const expanded=featuresToggle.getAttribute('aria-expanded')!=='true';featuresToggle.setAttribute('aria-expanded',String(expanded));featuresToggle.textContent=expanded?'Ver menos':'Ver mais';featuresExtra.hidden=!expanded};
