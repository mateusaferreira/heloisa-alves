(()=>{
  const $=selector=>document.querySelector(selector);
  const dialog=$('#video-dialog'),video=$('#property-video'),frame=$('#video-frame'),chrome=$('#video-chrome');
  if(!dialog||!video||!$('#open-video'))return;
  const tap=$('#video-tap'),play=$('#video-play'),mute=$('#video-mute'),fullscreen=$('#video-fullscreen');
  const progress=$('#video-progress'),time=$('#video-time'),status=$('#video-status'),feedback=$('#video-feedback');
  const source=video.querySelector('source'),mediaURL=source.src;
  source.removeAttribute('src');
  let mediaPromise=null,mediaObjectURL=null;
  let hideTimer,feedbackTimer,loadingTimer,playPending=false;
  let scrubbing=false,seekTarget=null,resumeAfterSeek=false;
  const icon=(button,name)=>button.querySelector('use').setAttribute('href','#vp-'+name);
  const stamp=value=>{const seconds=Math.floor(Number.isFinite(value)?value:0);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')};
  function showStatus(message){status.textContent=message;status.hidden=!message}
  async function ensureMedia(){
    if(mediaObjectURL)return;
    if(mediaPromise)return mediaPromise;
    showStatus('Carregando vídeo…');play.disabled=true;progress.disabled=true;
    mediaPromise=(async()=>{
      // The private host returns HTTP 200 for Range requests. A complete Blob
      // gives mobile media engines a local, fully seekable source instead.
      const response=await fetch(mediaURL,{credentials:'same-origin',cache:'force-cache'});
      if(!response.ok)throw Error('Video download failed');
      const blob=await response.blob();
      if(!blob.size||blob.type.includes('text/html'))throw Error('Invalid video response');
      mediaObjectURL=URL.createObjectURL(blob);
      await new Promise((resolve,reject)=>{
        const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',ready);video.removeEventListener('error',failed)};
        const ready=()=>{cleanup();resolve()};
        const failed=()=>{cleanup();reject(Error('Video metadata unavailable'))};
        const timer=setTimeout(failed,20000);
        video.addEventListener('loadedmetadata',ready);video.addEventListener('error',failed);
        video.src=mediaObjectURL;video.preload='auto';video.load();
      });
      play.disabled=false;showStatus('');fit();updateTime();
    })().catch(error=>{if(mediaObjectURL)URL.revokeObjectURL(mediaObjectURL);mediaObjectURL=null;mediaPromise=null;play.disabled=false;throw error});
    return mediaPromise;
  }
  function fit(){
    if(!dialog.open||document.fullscreenElement===frame)return;
    const viewport=window.visualViewport;
    const width=Math.min(480,(viewport?.width||window.innerWidth)-24)-24;
    const heading=dialog.querySelector('.video-heading').getBoundingClientRect().height;
    const height=Math.max(1,(viewport?.height||window.innerHeight)-24-24-heading-12);
    const ratio=video.videoWidth&&video.videoHeight?video.videoWidth/video.videoHeight:9/16;
    const fitted=Math.floor(Math.min(width,height*ratio));
    const stageWidth=Math.max(fitted,Math.min(width,264));
    frame.style.width=stageWidth+'px';frame.style.height=Math.floor(fitted/ratio)+'px';dialog.style.width=(stageWidth+24)+'px';
  }
  function reveal(){clearTimeout(hideTimer);chrome.classList.remove('is-hidden');if(!video.paused&&!video.ended&&!scrubbing&&seekTarget===null)hideTimer=setTimeout(()=>chrome.classList.add('is-hidden'),2800)}
  function paintTime(current,total){time.textContent=stamp(current)+' / '+stamp(total);progress.style.setProperty('--progress',(total?current/total*100:0)+'%');progress.setAttribute('aria-valuetext',stamp(current)+' de '+stamp(total))}
  function updateTime(){const total=Number.isFinite(video.duration)?video.duration:0;progress.disabled=!total;if(scrubbing||seekTarget!==null)return;const current=video.currentTime||0;progress.value=total?String(current/total*1000):'0';paintTime(current,total)}
  function beginScrub(){if(progress.disabled||scrubbing)return;if(seekTarget===null)resumeAfterSeek=!video.paused&&!video.ended;scrubbing=true;video.pause();reveal()}
  function previewScrub(){if(!Number.isFinite(video.duration))return;beginScrub();paintTime(Number(progress.value)/1000*video.duration,video.duration);reveal()}
  function finishSeek(){if(seekTarget===null)return;seekTarget=null;const resume=resumeAfterSeek;resumeAfterSeek=false;updateTime();reveal();if(resume&&dialog.open&&!video.ended)video.play().catch(error=>{if(error.name!=='AbortError')showStatus('Toque no vídeo para continuar a reprodução.')})}
  function commitScrub(){
    if(!scrubbing)return;
    const target=Number(progress.value)/1000*video.duration;scrubbing=false;
    if(!Number.isFinite(target)){resumeAfterSeek=false;updateTime();return}
    seekTarget=target;paintTime(target,video.duration);reveal();
    if(Math.abs(video.currentTime-target)<.02&&!video.seeking){finishSeek();return}
    try{video.currentTime=target}catch{seekTarget=null;resumeAfterSeek=false;updateTime();showStatus('Não foi possível avançar o vídeo. Tente novamente.')}
  }
  function updatePlayback(){const paused=video.paused||video.ended;if(paused){clearTimeout(loadingTimer);if(status.textContent==='Carregando vídeo…')showStatus('')}icon(play,paused?'play':'pause');play.setAttribute('aria-label',paused?'Reproduzir vídeo':'Pausar vídeo');tap.setAttribute('aria-label',paused?'Reproduzir vídeo ao tocar':'Pausar vídeo ao tocar');frame.dataset.playback=paused?'paused':'playing';reveal()}
  function flash(name){icon(feedback,name);feedback.classList.add('is-visible');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>feedback.classList.remove('is-visible'),550)}
  async function toggle(fromScreen=false){
    if(playPending)return;
    if(scrubbing||seekTarget!==null){resumeAfterSeek=!resumeAfterSeek;reveal();return}
    reveal();
    if(video.paused||video.ended){playPending=true;try{await ensureMedia();if(!dialog.open)return;showStatus('');if(video.ended)video.currentTime=0;await video.play();if(fromScreen)flash('play')}catch(error){if(error.name!=='AbortError')showStatus('Não foi possível reproduzir. Toque para tentar novamente.')}finally{playPending=false}}
    else{video.pause();if(fromScreen)flash('pause')}
  }
  $('#open-video').onclick=()=>{dialog.showModal();document.body.classList.add('modal-open');reveal();fit();updatePlayback();updateTime();ensureMedia().catch(()=>showStatus('Não foi possível carregar o vídeo. Toque para tentar novamente.'))};
  $('#close-video').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{scrubbing=false;seekTarget=null;resumeAfterSeek=false;video.pause();clearTimeout(hideTimer);clearTimeout(feedbackTimer);clearTimeout(loadingTimer);feedback.classList.remove('is-visible');document.body.classList.remove('modal-open');if(document.fullscreenElement===frame)document.exitFullscreen().catch(()=>{})});
  tap.onclick=()=>toggle(true);play.onclick=()=>toggle();
  mute.onclick=()=>{video.muted=!video.muted;reveal()};
  video.addEventListener('volumechange',()=>{icon(mute,video.muted||video.volume===0?'muted':'sound');mute.setAttribute('aria-label',video.muted?'Ativar som':'Silenciar vídeo');mute.setAttribute('aria-pressed',String(video.muted))});
  progress.addEventListener('pointerdown',beginScrub);
  progress.addEventListener('input',previewScrub);
  progress.addEventListener('change',commitScrub);
  progress.addEventListener('blur',commitScrub);
  window.addEventListener('pointerup',commitScrub);
  window.addEventListener('pointercancel',commitScrub);
  video.addEventListener('seeked',()=>{if(!scrubbing)finishSeek()});
  fullscreen.onclick=async()=>{reveal();try{if(document.fullscreenElement===frame)await document.exitFullscreen();else if(frame.requestFullscreen)await frame.requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()}catch{showStatus('A tela cheia não está disponível neste navegador.')}};
  fullscreen.hidden=!document.fullscreenEnabled&&!video.webkitEnterFullscreen;
  document.addEventListener('fullscreenchange',()=>{icon(fullscreen,document.fullscreenElement===frame?'exit-fullscreen':'fullscreen');fullscreen.setAttribute('aria-label',document.fullscreenElement===frame?'Sair da tela cheia':'Abrir em tela cheia');fit();reveal()});
  ['play','pause','ended'].forEach(event=>video.addEventListener(event,updatePlayback));
  ['loadedmetadata','durationchange'].forEach(event=>video.addEventListener(event,()=>{fit();updateTime()}));
  video.addEventListener('timeupdate',updateTime);
  video.addEventListener('waiting',()=>{clearTimeout(loadingTimer);loadingTimer=setTimeout(()=>{if(!video.paused)showStatus('Carregando vídeo…')},450)});
  video.addEventListener('playing',()=>{clearTimeout(loadingTimer);showStatus('')});
  video.addEventListener('canplay',()=>{clearTimeout(loadingTimer);showStatus('')});
  video.addEventListener('error',()=>showStatus('Não foi possível carregar o vídeo. Feche e tente novamente.'));
  frame.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')reveal()});
  chrome.addEventListener('pointerdown',reveal);chrome.addEventListener('focusin',reveal);
  dialog.addEventListener('keydown',event=>{if(event.target===progress)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();if(Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+(event.key==='ArrowRight'?5:-5)));updateTime();reveal()}else if(event.key.toLowerCase()==='m'){event.preventDefault();mute.click()}});
  window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
  window.addEventListener('pagehide',event=>{if(!event.persisted&&mediaObjectURL)URL.revokeObjectURL(mediaObjectURL)});
  video.controls=false;frame.classList.add('is-enhanced');tap.hidden=false;chrome.hidden=false;updatePlayback();updateTime();
})();
