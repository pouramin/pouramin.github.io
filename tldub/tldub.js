(() => {
  const API='https://tldub-api.pouramin.dev/tldub/api',$=(s,p=document)=>p.querySelector(s),state={segments:[],videoId:'',title:'',auth:false,csrf:null,aiConfigured:false,translationSource:'',youtubeEnglish:[],aiModels:[],aiComplete:false,aiRunning:false};
  const els={apiState:$('[data-api-state]'),apiDot:$('[data-api-dot]'),authPill:$('[data-auth-pill]'),connect:$('[data-connect]'),disconnect:$('[data-disconnect]'),accountNote:$('[data-account-note]'),videoUrl:$('[data-video-url]'),load:$('[data-load]'),translate:$('[data-translate]'),status:$('[data-status]'),results:$('[data-results]'),count:$('[data-segment-count]'),title:$('[data-video-title]'),meta:$('[data-video-meta]'),body:$('[data-script-body]'),mobile:$('[data-mobile-script]'),aiTranslate:$('[data-ai-translate]'),aiNote:$('[data-ai-note]'),aiProgressRow:$('[data-ai-progress-row]'),aiProgress:$('[data-ai-progress]'),aiProgressText:$('[data-ai-progress-text]'),restoreYoutube:$('[data-restore-youtube]'),youtubeExport:$('[data-youtube-export]'),currentEnLabel:$('[data-current-en-label]'),currentVttLabel:$('[data-current-vtt-label]'),privateContent:[...document.querySelectorAll('[data-private-content]')]};
  const setStatus=(text,kind='')=>{els.status.textContent=text;els.status.className='status-box'+(kind?' '+kind:'')};
  const fmt=(sec,comma=false)=>{const ms=Math.max(0,Math.round(Number(sec||0)*1000)),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000,sep=comma?',':'.';return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${sep}${String(x).padStart(3,'0')}`};
  const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const snapshotYouTubeEnglish=()=>{state.youtubeEnglish=state.segments.map(s=>String(s.translatedText||''));state.segments.forEach(s=>{s.aiAdapted=false});state.aiComplete=false;state.aiModels=[]};
  const setProgress=(done,total,label='')=>{const pct=total?Math.round(done/total*100):0;if(els.aiProgressRow)els.aiProgressRow.hidden=false;if(els.aiProgress){els.aiProgress.max=100;els.aiProgress.value=pct}if(els.aiProgressText)els.aiProgressText.textContent=label||pct+'%'};
  const hideProgress=()=>{if(els.aiProgressRow)els.aiProgressRow.hidden=true};
  const refreshExportLabels=()=>{const adapted=state.segments.filter(s=>s.aiAdapted).length,hasAI=adapted>0;if(els.currentEnLabel)els.currentEnLabel.textContent=hasAI?(state.aiComplete?'AI English SRT':'Partial AI SRT'):'English SRT';if(els.currentVttLabel)els.currentVttLabel.textContent=hasAI?(state.aiComplete?'AI English VTT':'Partial AI VTT'):'English VTT';if(els.youtubeExport)els.youtubeExport.hidden=!hasAI;if(els.restoreYoutube)els.restoreYoutube.hidden=!hasAI;if(els.aiTranslate&&!state.aiRunning)els.aiTranslate.textContent=state.aiComplete?'Re-adapt English':hasAI?'Resume AI adaptation':'Adapt English to timing'};
  const updateEnglishFields=indexes=>{for(const i of indexes){document.querySelectorAll('textarea[data-index="'+i+'"][data-field="translatedText"]').forEach(el=>{el.value=state.segments[i]?.translatedText||''})}};

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
    refreshExportLabels();
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
      snapshotYouTubeEnglish();
      hideProgress();
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
    if(state.aiRunning)return;

    if(state.aiComplete){
      state.segments.forEach((seg,i)=>{seg.translatedText=state.youtubeEnglish[i]||seg.translatedText;seg.aiAdapted=false});
      state.aiComplete=false;
      state.aiModels=[];
      updateEnglishFields(state.segments.map((_,i)=>i));
    }

    state.aiRunning=true;
    refreshExportLabels();
    els.aiTranslate.disabled=true;
    els.aiTranslate.textContent='Adapting…';
    els.load.disabled=true;

    const batchSize=20,total=state.segments.length,totalBatches=Math.ceil(total/batchSize);
    let completed=state.segments.filter(s=>s.aiAdapted).length;
    const completedBatches=Math.floor(completed/batchSize);
    setProgress(completed,total,completedBatches+'/'+totalBatches+' batches · '+completed+'/'+total+' segments');
    setStatus('AI dubbing adaptation · resuming from segment '+(completed+1)+'…');

    try{
      for(let offset=0,batchNo=1;offset<total;offset+=batchSize,batchNo++){
        const batch=state.segments.slice(offset,offset+batchSize);
        if(batch.every(seg=>seg.aiAdapted))continue;

        const contextBefore=state.segments.slice(Math.max(0,offset-3),offset);
        const contextAfter=state.segments.slice(offset+batch.length,offset+batch.length+3);
        setStatus('AI dubbing adaptation · batch '+batchNo+'/'+totalBatches+' · segments '+(offset+1)+'-'+(offset+batch.length)+'…');

        const data=await jsonFetch(API+'/translate',{
          method:'POST',
          body:JSON.stringify({segments:batch,contextBefore,contextAfter,singleBatch:true})
        });

        const byId=new Map((data.segments||[]).map(item=>[Number(item.index),item.translatedText]));
        const touched=[];
        for(let local=0;local<batch.length;local++){
          const globalIndex=offset+local;
          const seg=state.segments[globalIndex];
          const text=byId.get(Number(seg.index));
          if(typeof text==='string'&&text.trim()){
            seg.translatedText=text.trim();
            seg.aiAdapted=true;
            touched.push(globalIndex);
          }
        }

        for(const model of (data.resolvedModels||[])){if(model&&!state.aiModels.includes(model))state.aiModels.push(model)}
        completed=state.segments.filter(s=>s.aiAdapted).length;
        updateEnglishFields(touched);
        refreshExportLabels();
        const doneBatches=Math.ceil(completed/batchSize);
        setProgress(completed,total,doneBatches+'/'+totalBatches+' batches · '+completed+'/'+total+' segments');
      }

      state.translationSource='AI dubbing adaptation';
      state.aiComplete=state.segments.every(s=>s.aiAdapted);
      refreshExportLabels();
      const modelText=state.aiModels.length?state.aiModels.join(', '):'OpenRouter free router';
      if(els.aiNote)els.aiNote.textContent='AI adaptation complete · models used: '+modelText;
      setProgress(total,total,'Complete · '+total+'/'+total+' segments');
      render();
      setStatus('AI dubbing adaptation complete. '+total+' segments updated. Use AI English SRT/VTT or Project JSON to save the result.','success');
    }catch(err){
      completed=state.segments.filter(s=>s.aiAdapted).length;
      const msg=err.message||'Could not adapt the English script.';
      const partial=completed>0?' '+completed+'/'+total+' segments are already saved in this page; Resume will continue from the next batch.':'';
      if(/auth|connect|authorization|401|expired|security token/i.test(msg)){state.auth=false;state.csrf=null;els.privateContent.forEach(el=>{el.hidden=true})}
      setStatus(msg+partial,'error');
      if(els.aiNote)els.aiNote.textContent='Stopped: '+msg;
      refreshExportLabels();
    }finally{
      state.aiRunning=false;
      els.aiTranslate.disabled=!state.aiConfigured;
      els.load.disabled=false;
      refreshExportLabels();
    }
  });

  els.restoreYoutube?.addEventListener('click',()=>{
    if(!state.youtubeEnglish.length||state.youtubeEnglish.length!==state.segments.length)return;
    state.segments.forEach((seg,i)=>{seg.translatedText=state.youtubeEnglish[i]||'';seg.aiAdapted=false});
    state.translationSource='YouTube machine translation';
    state.aiComplete=false;
    state.aiModels=[];
    hideProgress();
    render();
    setStatus('Restored the original YouTube English translation.','success');
    if(els.aiNote)els.aiNote.textContent='Ready for timing-aware English rewrite.';
  });

  const makeSrt=translated=>state.segments.map((s,i)=>`${i+1}\n${fmt(s.start,true)} --> ${fmt(s.end,true)}\n${translated?(s.translatedText||s.sourceText):s.sourceText}\n`).join('\n');
  const makeYouTubeSrt=()=>state.segments.map((s,i)=>(i+1)+'\n'+fmt(s.start,true)+' --> '+fmt(s.end,true)+'\n'+(state.youtubeEnglish[i]||s.sourceText)+'\n').join('\n');
  const makeVtt=translated=>'WEBVTT\n\n'+state.segments.map(s=>`${fmt(s.start)} --> ${fmt(s.end)}\n${translated?(s.translatedText||s.sourceText):s.sourceText}\n`).join('\n');
  function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}


  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-export]');
    if(!btn||!state.segments.length)return;
    const id=state.videoId||'video';
    const adapted=state.segments.some(s=>s.aiAdapted);
    const suffix=state.aiComplete?'.ai.en':adapted?'.ai.partial.en':'.en';
    switch(btn.dataset.export){
      case'source-srt':download(id+'.fa.srt',makeSrt(false));break;
      case'target-srt':download(id+suffix+'.srt',makeSrt(true));break;
      case'target-vtt':download(id+suffix+'.vtt',makeVtt(true),'text/vtt;charset=utf-8');break;
      case'youtube-srt':download(id+'.youtube.en.srt',makeYouTubeSrt());break;
      case'json':download(id+'.tldub.json',JSON.stringify({videoId:state.videoId,title:state.title,translationSource:state.translationSource,aiComplete:state.aiComplete,aiModels:state.aiModels,youtubeEnglish:state.youtubeEnglish,segments:state.segments},null,2),'application/json;charset=utf-8');break;
    }
  });
  const params=new URLSearchParams(location.search);if(params.get('oauth')==='ok'){history.replaceState({},'','/tldub/');setStatus('YouTube connected. Paste a video URL.','success')}if(params.get('oauth_error')){const m=params.get('oauth_error');history.replaceState({},'','/tldub/');setStatus(m||'YouTube authorization failed.','error')}
  (async()=>{await checkBackend();await checkAuth()})();
})();