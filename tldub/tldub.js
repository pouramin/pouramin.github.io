(() => {
  const API='https://tldub-api.pouramin.dev/tldub/api',$=(s,p=document)=>p.querySelector(s),state={segments:[],videoId:'',title:'',auth:false,csrf:null,aiConfigured:false,translationSource:''};
  const els={apiState:$('[data-api-state]'),apiDot:$('[data-api-dot]'),authPill:$('[data-auth-pill]'),connect:$('[data-connect]'),disconnect:$('[data-disconnect]'),accountNote:$('[data-account-note]'),videoUrl:$('[data-video-url]'),load:$('[data-load]'),translate:$('[data-translate]'),status:$('[data-status]'),results:$('[data-results]'),count:$('[data-segment-count]'),title:$('[data-video-title]'),meta:$('[data-video-meta]'),body:$('[data-script-body]'),mobile:$('[data-mobile-script]'),aiTranslate:$('[data-ai-translate]'),aiNote:$('[data-ai-note]'),privateContent:[...document.querySelectorAll('[data-private-content]')]};
  const setStatus=(text,kind='')=>{els.status.textContent=text;els.status.className='status-box'+(kind?' '+kind:'')};
  const fmt=(sec,comma=false)=>{const ms=Math.max(0,Math.round(Number(sec||0)*1000)),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000,sep=comma?',':'.';return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${sep}${String(x).padStart(3,'0')}`};
  const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function jsonFetch(url,options={}){const method=(options.method||'GET').toUpperCase();const headers={'Content-Type':'application/json',...(options.headers||{})};if(method==='POST'&&state.csrf)headers['X-TL-Dub-CSRF']=state.csrf;const response=await fetch(url,{credentials:'include',...options,headers});let data=null;try{data=await response.json()}catch(_){data={error:`HTTP ${response.status}`}}if(!response.ok)throw new Error(data?.error||data?.message||`HTTP ${response.status}`);return data}
  async function checkBackend(){
    try{
      const data=await jsonFetch(`${API}/health`,{headers:{}});
      state.aiConfigured=Boolean(data.aiConfigured);
      els.apiState.textContent=data?.status==='ok'?'Backend online':'Backend reachable';
      els.apiDot.style.background='#2bb673';
      if(els.aiTranslate)els.aiTranslate.disabled=!state.aiConfigured;
      if(els.aiNote)els.aiNote.textContent=state.aiConfigured?'Ready for timing-aware English rewrite.':'AI provider is not configured yet.';
      return true;
    }catch(_){
      state.aiConfigured=false;
      els.apiState.textContent='Backend not deployed yet';
      els.apiDot.style.background='#d29b2c';
      if(els.aiTranslate)els.aiTranslate.disabled=true;
      return false;
    }
  }
  async function checkAuth(){try{const data=await jsonFetch(`${API}/oauth/status`,{headers:{}});state.auth=Boolean(data.connected);state.csrf=data.csrfToken||null;els.authPill.textContent=state.auth?'Connected':'Not connected';els.authPill.classList.toggle('connected',state.auth);els.connect.hidden=state.auth;els.disconnect.hidden=!state.auth;els.privateContent.forEach(el=>{el.hidden=!state.auth});els.accountNote.textContent=state.auth?(data.channel?.title?`Connected privately to ${data.channel.title}. Session expires automatically.`:'Private YouTube authorization is active on this device.'):'Private tool: connect the authorized YouTube account to unlock it.'}catch(_){state.auth=false;state.csrf=null;els.privateContent.forEach(el=>{el.hidden=true});els.authPill.textContent='Backend required';els.connect.hidden=false;els.disconnect.hidden=true}}
  function render(){
    els.count.textContent=`${state.segments.length} segments`;
    els.title.textContent=state.title||'Untitled video';
    const meta=[];
    if(state.videoId)meta.push(`Video ID: ${state.videoId}`);
    if(state.translationSource)meta.push(`English: ${state.translationSource}`);
    els.meta.textContent=meta.join(' · ');
    els.body.innerHTML=state.segments.map((seg,i)=>`<tr><td>${i+1}</td><td class="time">${fmt(seg.start)}<br>→ ${fmt(seg.end)}</td><td><textarea dir="rtl" data-index="${i}" data-field="sourceText">${esc(seg.sourceText)}</textarea></td><td><textarea data-index="${i}" data-field="translatedText">${esc(seg.translatedText||'')}</textarea></td></tr>`).join('');
    els.mobile.innerHTML=state.segments.map((seg,i)=>`<article class="script-card"><div class="script-card-top"><span>#${i+1}</span><span>${fmt(seg.start)} → ${fmt(seg.end)}</span></div><label>Persian</label><textarea dir="rtl" data-index="${i}" data-field="sourceText">${esc(seg.sourceText)}</textarea><label>English</label><textarea data-index="${i}" data-field="translatedText">${esc(seg.translatedText||'')}</textarea></article>`).join('');
    els.results.hidden=false;
  }
  function syncEdit(e){const t=e.target;if(!t.matches('textarea[data-index][data-field]'))return;const i=Number(t.dataset.index),field=t.dataset.field;if(!state.segments[i]||!field)return;state.segments[i][field]=t.value;document.querySelectorAll(`textarea[data-index="${i}"][data-field="${field}"]`).forEach(o=>{if(o!==t)o.value=t.value})}
  els.body?.addEventListener('input',syncEdit);els.mobile?.addEventListener('input',syncEdit);
  els.connect?.addEventListener('click',()=>{location.href=`${API}/oauth/start?return_to=${encodeURIComponent('/tldub/')}`});
  els.disconnect?.addEventListener('click',async()=>{try{await jsonFetch(`${API}/oauth/logout`,{method:'POST',body:'{}'})}catch(_){}state.csrf=null;state.segments=[];els.results.hidden=true;await checkAuth();setStatus('YouTube disconnected and access token revoked.')});
  els.load?.addEventListener('click',async()=>{
    const url=els.videoUrl.value.trim();
    if(!url){setStatus('Paste a YouTube video URL first.','error');return}
    els.load.disabled=true;
    setStatus('Reading caption tracks from YouTube…');
    try{
      const data=await jsonFetch(`${API}/transcript`,{method:'POST',body:JSON.stringify({url,sourceLanguage:'fa',targetLanguage:'en',translate:els.translate.checked})});
      state.segments=data.segments||[];
      state.videoId=data.videoId||'';
      state.title=data.title||'YouTube video';
      state.translationSource=data.translationSource||'';
      if(!state.segments.length)throw new Error('No caption segments were returned.');
      render();
      setStatus(`Loaded ${state.segments.length} timed segments${data.translationSource?` · English: ${data.translationSource}`:''}.`,'success');
    }catch(err){
      if(/auth|connect|authorization|401|expired|security token/i.test(err.message)){state.auth=false;state.csrf=null;els.privateContent.forEach(el=>{el.hidden=true})}
      setStatus(err.message||'Could not load this video.','error');
      await checkAuth();
    }finally{els.load.disabled=false}
  });

  els.aiTranslate?.addEventListener('click',async()=>{
    if(!state.segments.length){setStatus('Load a timed script first.','error');return}
    if(!state.aiConfigured){setStatus('AI dubbing is not configured on the backend yet.','error');return}
    els.aiTranslate.disabled=true;
    els.load.disabled=true;
    setStatus('Adapting English for natural dubbing and segment timing…');
    try{
      const data=await jsonFetch(`${API}/translate`,{method:'POST',body:JSON.stringify({segments:state.segments})});
      const byId=new Map((data.segments||[]).map(item=>[Number(item.index),item.translatedText]));
      for(const seg of state.segments){
        const text=byId.get(Number(seg.index));
        if(typeof text==='string'&&text.trim())seg.translatedText=text.trim();
      }
      state.translationSource=data.translationSource||'AI dubbing adaptation';
      if(els.aiNote)els.aiNote.textContent=data.model?`Adapted with ${data.model}. Review before voice generation.`:'AI dubbing adaptation applied. Review before voice generation.';
      render();
      setStatus('English rewrite finished. Timing-aware dubbing text is ready for review.','success');
    }catch(err){
      if(/auth|connect|authorization|401|expired|security token/i.test(err.message)){state.auth=false;state.csrf=null;els.privateContent.forEach(el=>{el.hidden=true})}
      setStatus(err.message||'Could not adapt the English script.','error');
    }finally{
      els.aiTranslate.disabled=!state.aiConfigured;
      els.load.disabled=false;
    }
  });
  const makeSrt=translated=>state.segments.map((s,i)=>`${i+1}\n${fmt(s.start,true)} --> ${fmt(s.end,true)}\n${translated?(s.translatedText||s.sourceText):s.sourceText}\n`).join('\n');
  const makeVtt=translated=>'WEBVTT\n\n'+state.segments.map(s=>`${fmt(s.start)} --> ${fmt(s.end)}\n${translated?(s.translatedText||s.sourceText):s.sourceText}\n`).join('\n');
  function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-export]');if(!btn||!state.segments.length)return;const id=state.videoId||'video';switch(btn.dataset.export){case'source-srt':download(`${id}.fa.srt`,makeSrt(false));break;case'target-srt':download(`${id}.en.srt`,makeSrt(true));break;case'target-vtt':download(`${id}.en.vtt`,makeVtt(true),'text/vtt;charset=utf-8');break;case'json':download(`${id}.tldub.json`,JSON.stringify({videoId:state.videoId,title:state.title,segments:state.segments},null,2),'application/json;charset=utf-8');break}});
  const params=new URLSearchParams(location.search);if(params.get('oauth')==='ok'){history.replaceState({},'','/tldub/');setStatus('YouTube connected. Paste a video URL.','success')}if(params.get('oauth_error')){const m=params.get('oauth_error');history.replaceState({},'','/tldub/');setStatus(m||'YouTube authorization failed.','error')}
  (async()=>{await checkBackend();await checkAuth()})();
})();