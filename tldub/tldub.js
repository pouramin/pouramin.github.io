(() => {
  const API='https://tldub-api.pouramin.dev/tldub/api',$=(s,p=document)=>p.querySelector(s),state={segments:[],videoId:'',title:'',auth:false,youtubeAccessValid:false,csrf:null,aiConfigured:false,aiCredentialCount:0,translationSource:'',youtubeEnglish:[],aiModels:[],aiCredentialSlotsUsed:[],aiComplete:false,aiRunning:false,glossary:[],glossaryModel:'',qcIssues:[],qcRepairBatches:0,qcRepairSkippedBatches:0,qcFinalRepairCalls:0,qcRepairFailed:false,projectCreatedAt:null,projectFolderName:'',projectOriginalUrl:'',forceYoutubeRefresh:false,projectStorage:false,pipelineVersion:1,previousEnglishBackup:null,semanticAuditComplete:false};
  const els={apiState:$('[data-api-state]'),apiDot:$('[data-api-dot]'),authPill:$('[data-auth-pill]'),connect:$('[data-connect]'),disconnect:$('[data-disconnect]'),accountNote:$('[data-account-note]'),videoUrl:$('[data-video-url]'),load:$('[data-load]'),translate:$('[data-translate]'),status:$('[data-status]'),results:$('[data-results]'),count:$('[data-segment-count]'),title:$('[data-video-title]'),meta:$('[data-video-meta]'),body:$('[data-script-body]'),mobile:$('[data-mobile-script]'),aiTranslate:$('[data-ai-translate]'),aiNote:$('[data-ai-note]'),aiProgressRow:$('[data-ai-progress-row]'),aiProgress:$('[data-ai-progress]'),aiProgressText:$('[data-ai-progress-text]'),restoreYoutube:$('[data-restore-youtube]'),youtubeExport:$('[data-youtube-export]'),currentEnLabel:$('[data-current-en-label]'),currentVttLabel:$('[data-current-vtt-label]'),projectMemoryNote:$('[data-project-memory-note]'),projectList:$('[data-project-list]'),projectOpen:$('[data-project-open]'),projectImport:$('[data-project-import]'),projectFile:$('[data-project-file]'),projectRefresh:$('[data-project-refresh]'),privateContent:[...document.querySelectorAll('[data-private-content]')]};
  const setStatus=(text,kind='')=>{els.status.textContent=text;els.status.className='status-box'+(kind?' '+kind:'')};
  const fmt=(sec,comma=false)=>{const ms=Math.max(0,Math.round(Number(sec||0)*1000)),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000,sep=comma?',':'.';return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${sep}${String(x).padStart(3,'0')}`};
  const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const snapshotYouTubeEnglish=()=>{state.youtubeEnglish=state.segments.map(s=>String(s.translatedText||''));state.segments.forEach(s=>{s.aiAdapted=false;s.qcIssues=[]});state.aiComplete=false;state.pipelineVersion=1;state.previousEnglishBackup=null;state.aiModels=[];state.glossary=[];state.glossaryModel='';state.qcIssues=[];state.qcRepairBatches=0;state.qcRepairSkippedBatches=0;state.qcFinalRepairCalls=0;state.qcRepairFailed=false;state.aiCredentialSlotsUsed=[]};
  const setProgress=(done,total,label='')=>{const pct=total?Math.round(done/total*100):0;if(els.aiProgressRow)els.aiProgressRow.hidden=false;if(els.aiProgress){els.aiProgress.max=100;els.aiProgress.value=pct}if(els.aiProgressText)els.aiProgressText.textContent=label||pct+'%'};
  const hideProgress=()=>{if(els.aiProgressRow)els.aiProgressRow.hidden=true};
  const refreshExportLabels=()=>{const adapted=state.segments.filter(s=>s.aiAdapted).length,hasAI=adapted>0,allAdapted=hasAI&&adapted===state.segments.length,severe=state.qcIssues.filter(issue=>issue.severity==='severe').length,v2=Number(state.pipelineVersion||1)>=2;if(els.currentEnLabel)els.currentEnLabel.textContent=allAdapted?'AI English SRT':hasAI?'Partial AI SRT':'English SRT';if(els.currentVttLabel)els.currentVttLabel.textContent=allAdapted?'AI English VTT':hasAI?'Partial AI VTT':'English VTT';if(els.youtubeExport)els.youtubeExport.hidden=!hasAI;if(els.restoreYoutube)els.restoreYoutube.hidden=!hasAI;if(els.aiTranslate&&!state.aiRunning)els.aiTranslate.textContent=allAdapted&&v2&&!state.semanticAuditComplete?'Resume semantic QC':allAdapted&&severe>0?'Retry final QC repair':allAdapted?'Reprocess English v2':hasAI?(v2?'Resume v2 reprocess':'Reprocess English v2'):'Adapt English v2'};
  const updateEnglishFields=indexes=>{for(const i of indexes){document.querySelectorAll('textarea[data-index="'+i+'"][data-field="translatedText"]').forEach(el=>{el.value=state.segments[i]?.translatedText||''})}};


  const PROJECT_DB='tldub-projects',PROJECT_STORE='projects',PROJECT_DB_VERSION=1;
  let projectDbPromise=null,autosaveTimer=null;

  function openProjectDb(){
    if(projectDbPromise)return projectDbPromise;
    projectDbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(PROJECT_DB,PROJECT_DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(PROJECT_STORE)){
          const store=db.createObjectStore(PROJECT_STORE,{keyPath:'videoId'});
          store.createIndex('updatedAt','updatedAt');
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Could not open local project memory.'));
    });
    return projectDbPromise;
  }

  function clientVideoId(value){
    try{
      const url=new URL(String(value||'').trim());
      if(url.hostname==='youtu.be')return url.pathname.split('/').filter(Boolean)[0]||'';
      if(url.searchParams.get('v'))return url.searchParams.get('v')||'';
      const parts=url.pathname.split('/').filter(Boolean);
      const shorts=parts.indexOf('shorts');
      if(shorts>=0&&parts[shorts+1])return parts[shorts+1];
      const embed=parts.indexOf('embed');
      if(embed>=0&&parts[embed+1])return parts[embed+1];
    }catch(_){}
    return '';
  }

  function safeFolderName(title,videoId){
    const cleaned=String(title||'YouTube video').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001F]/g,'-').replace(/\s+/g,' ').trim().slice(0,110);
    return (cleaned||'YouTube video')+' -- '+String(videoId||'project');
  }

  function currentProjectFiles(){
    if(!state.segments.length)return {};
    const sourceSrt=state.segments.map((s,i)=>(i+1)+'\n'+fmt(s.start,true)+' --> '+fmt(s.end,true)+'\n'+(s.sourceText||'')+'\n').join('\n');
    const currentSrt=state.segments.map((s,i)=>(i+1)+'\n'+fmt(s.start,true)+' --> '+fmt(s.end,true)+'\n'+(s.translatedText||s.sourceText||'')+'\n').join('\n');
    const currentVtt='WEBVTT\n\n'+state.segments.map(s=>fmt(s.start)+' --> '+fmt(s.end)+'\n'+(s.translatedText||s.sourceText||'')+'\n').join('\n');
    const youtubeSrt=state.segments.map((s,i)=>(i+1)+'\n'+fmt(s.start,true)+' --> '+fmt(s.end,true)+'\n'+(state.youtubeEnglish[i]||s.sourceText||'')+'\n').join('\n');
    return {
      'source.fa.srt':sourceSrt,
      'youtube.en.srt':youtubeSrt,
      'current.en.srt':currentSrt,
      'current.en.vtt':currentVtt,
      'glossary.json':JSON.stringify(state.glossary||[],null,2),
      'qc.json':JSON.stringify({
        repairBatches:state.qcRepairBatches,
        repairSkippedBatches:state.qcRepairSkippedBatches,
        finalRepairCalls:state.qcFinalRepairCalls,
        repairFailed:state.qcRepairFailed,
        pipelineVersion:Number(state.pipelineVersion||1),
        issues:state.qcIssues||[]
      },null,2)
    };
  }

  function buildProjectSnapshot(){
    const now=new Date().toISOString();
    const createdAt=state.projectCreatedAt||now;
    const folderName=state.projectFolderName||safeFolderName(state.title,state.videoId);
    return {
      schemaVersion:1,
      videoId:state.videoId,
      title:state.title,
      folderName,
      originalUrl:state.projectOriginalUrl||els.videoUrl?.value||'',
      createdAt,
      updatedAt:now,
      translationSource:state.translationSource,
      pipelineVersion:Number(state.pipelineVersion||1),
      previousEnglishBackup:state.previousEnglishBackup||null,
      semanticAuditComplete:Boolean(state.semanticAuditComplete),
      aiComplete:Boolean(state.aiComplete),
      aiModels:[...(state.aiModels||[])],
      aiCredentialSlotsUsed:[...(state.aiCredentialSlotsUsed||[])],
      glossary:[...(state.glossary||[])],
      glossaryModel:state.glossaryModel||'',
      qc:{
        repairBatches:state.qcRepairBatches||0,
        repairSkippedBatches:state.qcRepairSkippedBatches||0,
        finalRepairCalls:state.qcFinalRepairCalls||0,
        repairFailed:Boolean(state.qcRepairFailed),
        issues:[...(state.qcIssues||[])]
      },
      youtubeEnglish:[...(state.youtubeEnglish||[])],
      segments:state.segments.map(seg=>({...seg,qcIssues:Array.isArray(seg.qcIssues)?[...seg.qcIssues]:[]}))
    };
  }

  async function saveProject(reason='autosave',refreshList=false){
    if(!state.videoId||!state.segments.length)return false;
    const snapshot=buildProjectSnapshot();
    let cloudSaved=false,cloudError=null,storedProject=snapshot;

    if(state.auth&&state.csrf){
      try{
        const data=await jsonFetch(API+'/projects/'+encodeURIComponent(state.videoId),{
          method:'POST',
          body:JSON.stringify({project:snapshot,files:currentProjectFiles()})
        });
        storedProject=data?.project||snapshot;
        cloudSaved=true;
        state.projectStorage=true;
      }catch(err){
        cloudError=err;
      }
    }

    try{
      const db=await openProjectDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(PROJECT_STORE,'readwrite');
        tx.objectStore(PROJECT_STORE).put(storedProject);
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('Local project cache failed.'));
        tx.onabort=()=>reject(tx.error||new Error('Local project cache aborted.'));
      });
    }catch(_){}

    state.projectCreatedAt=storedProject.createdAt||snapshot.createdAt;
    state.projectFolderName=storedProject.folderName||snapshot.folderName;
    state.projectOriginalUrl=storedProject.originalUrl||snapshot.originalUrl;
    try{localStorage.setItem('tldub:lastProject',state.videoId)}catch(_){}

    const adapted=state.segments.filter(seg=>seg.aiAdapted).length;
    if(els.projectMemoryNote){
      els.projectMemoryNote.textContent=cloudSaved
        ? 'Cloud autosaved · '+state.projectFolderName+' · '+adapted+'/'+state.segments.length+' AI segments · '+new Date(storedProject.updatedAt||Date.now()).toLocaleTimeString()
        : 'Saved to local cache · cloud sync pending'+(cloudError?': '+cloudError.message:'');
    }
    if(refreshList)await refreshProjectList(state.videoId);
    return cloudSaved;
  }

  function queueAutosave(reason='edit'){
    clearTimeout(autosaveTimer);
    autosaveTimer=setTimeout(()=>{saveProject(reason,false)},700);
  }

  async function getSavedProject(videoId){
    if(!videoId)return null;
    let cloudProject=null,localProject=null;

    if(state.auth&&state.csrf){
      try{
        const data=await jsonFetch(API+'/projects/'+encodeURIComponent(videoId),{headers:{}});
        if(data?.project){
          cloudProject=data.project;
          state.projectStorage=true;
        }
      }catch(err){
        if(err?.status!==404&&els.projectMemoryNote)els.projectMemoryNote.textContent='Cloud load unavailable; checking local cache…';
      }
    }

    try{
      const db=await openProjectDb();
      localProject=await new Promise((resolve,reject)=>{
        const req=db.transaction(PROJECT_STORE,'readonly').objectStore(PROJECT_STORE).get(videoId);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    }catch(_){}

    let chosen=cloudProject||localProject;
    if(cloudProject&&localProject){
      const cloudTime=Date.parse(cloudProject.updatedAt||cloudProject.createdAt||0)||0;
      const localTime=Date.parse(localProject.updatedAt||localProject.createdAt||0)||0;
      chosen=localTime>cloudTime?localProject:cloudProject;
    }

    if(chosen){
      try{
        const db=await openProjectDb();
        await new Promise((resolve,reject)=>{
          const tx=db.transaction(PROJECT_STORE,'readwrite');
          tx.objectStore(PROJECT_STORE).put(chosen);
          tx.oncomplete=()=>resolve();
          tx.onerror=()=>reject(tx.error);
        });
      }catch(_){}
    }
    return chosen||null;
  }

  async function listSavedProjects(){
    if(state.auth&&state.csrf){
      try{
        const data=await jsonFetch(API+'/projects',{headers:{}});
        if(Array.isArray(data?.projects)){
          state.projectStorage=true;
          return data.projects;
        }
      }catch(_){}
    }

    try{
      const db=await openProjectDb();
      const all=await new Promise((resolve,reject)=>{
        const req=db.transaction(PROJECT_STORE,'readonly').objectStore(PROJECT_STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
      return all.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    }catch(_){return []}
  }

  async function refreshProjectList(selected=''){
    if(!els.projectList)return;
    const projects=await listSavedProjects();
    els.projectList.innerHTML='<option value="">Saved projects…</option>'+projects.map(project=>{
      const adapted=Number.isFinite(Number(project.adaptedCount))?Number(project.adaptedCount):(project.segments||[]).filter(seg=>seg.aiAdapted).length;
      const total=Number.isFinite(Number(project.segmentCount))?Number(project.segmentCount):(project.segments?.length||0);
      const label=project.title+' · '+adapted+'/'+total+' · '+new Date(project.updatedAt||Date.now()).toLocaleDateString();
      return '<option value="'+esc(project.videoId)+'">'+esc(label)+'</option>';
    }).join('');
    if(selected)els.projectList.value=selected;
  }

  function restoreProject(project){
    if(!project||!project.videoId||!Array.isArray(project.segments)||!project.segments.length)throw new Error('This TL-Dub project file is invalid.');
    state.videoId=project.videoId;
    state.title=project.title||'YouTube video';
    state.translationSource=project.translationSource||'';
    state.pipelineVersion=Number(project.pipelineVersion||1);
    state.previousEnglishBackup=project.previousEnglishBackup||null;
    state.semanticAuditComplete=Boolean(project.semanticAuditComplete);
    state.youtubeEnglish=Array.isArray(project.youtubeEnglish)?project.youtubeEnglish:[];
    state.aiModels=Array.isArray(project.aiModels)?project.aiModels:[];
    state.aiCredentialSlotsUsed=Array.isArray(project.aiCredentialSlotsUsed)?project.aiCredentialSlotsUsed:[];
    state.aiComplete=Boolean(project.aiComplete);
    state.glossary=Array.isArray(project.glossary)?project.glossary:[];
    state.glossaryModel=project.glossaryModel||'';
    state.qcIssues=Array.isArray(project.qc?.issues)?project.qc.issues:[];
    state.qcRepairBatches=Number(project.qc?.repairBatches||0);
    state.qcRepairSkippedBatches=Number(project.qc?.repairSkippedBatches||0);
    state.qcFinalRepairCalls=Number(project.qc?.finalRepairCalls||0);
    state.qcRepairFailed=Boolean(project.qc?.repairFailed);
    state.segments=project.segments.map(seg=>({...seg,aiAdapted:Boolean(seg.aiAdapted),qcIssues:Array.isArray(seg.qcIssues)?seg.qcIssues:[]}));
    state.projectCreatedAt=project.createdAt||new Date().toISOString();
    state.projectFolderName=project.folderName||safeFolderName(state.title,state.videoId);
    state.projectOriginalUrl=project.originalUrl||('https://www.youtube.com/watch?v='+state.videoId);
    if(els.videoUrl)els.videoUrl.value=state.projectOriginalUrl;
    render();
    const adapted=state.segments.filter(seg=>seg.aiAdapted).length;
    if(adapted) setProgress(adapted,state.segments.length,(adapted===state.segments.length?'Translation saved · ':'Saved progress · ')+adapted+'/'+state.segments.length+' segments');
    else hideProgress();
    if(els.projectMemoryNote)els.projectMemoryNote.textContent=(state.projectStorage?'Cloud restored':'Local cache restored')+' · '+state.projectFolderName+' · saved '+new Date(project.updatedAt||project.createdAt||Date.now()).toLocaleString();
    try{localStorage.setItem('tldub:lastProject',state.videoId)}catch(_){}
    refreshExportLabels();
  }

  async function restoreLastProject(){
    let id='';
    try{id=localStorage.getItem('tldub:lastProject')||''}catch(_){}
    if(!id)return false;
    const project=await getSavedProject(id);
    if(!project)return false;
    restoreProject(project);
    await saveProject('restored and reconciled project',false);
    await refreshProjectList(id);
    setStatus('Restored the newest saved project and synced project memory. No YouTube or AI request was used.','success');
    return true;
  }

  async function jsonFetch(url,options={}){
    const method=(options.method||'GET').toUpperCase();
    const headers={'Content-Type':'application/json',...(options.headers||{})};
    if(method==='POST'&&state.csrf)headers['X-TL-Dub-CSRF']=state.csrf;
    let response;
    try{
      response=await fetch(url,{credentials:'include',...options,headers});
    }catch(cause){
      const error=new Error('Network request to TL-Dub API failed. The transcript is still loaded locally.');
      error.code='NETWORK_FETCH_FAILED';
      error.cause=cause;
      throw error;
    }
    let data=null;
    try{data=await response.json()}catch(_){data={error:`HTTP ${response.status}`}}
    if(!response.ok){
      const error=new Error(data?.error||data?.message||`HTTP ${response.status}`);
      error.status=response.status;
      throw error;
    }
    return data;
  }
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function sendAIBatch(payload,batchNo,totalBatches){
    const maxAttempts=2;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{
        return await jsonFetch(API+'/translate',{
          method:'POST',
          body:JSON.stringify(payload)
        });
      }catch(err){
        const retryable=err?.code==='NETWORK_FETCH_FAILED'||err?.status===502||err?.status===503||err?.status===504;
        if(!retryable||attempt===maxAttempts)throw err;
        setStatus('AI v2 adaptation · batch '+batchNo+'/'+totalBatches+' · temporary network/provider error, retry '+(attempt+1)+'/'+maxAttempts+'…');
        await sleep(1200*attempt);
      }
    }
  }

  async function ensureGlossary(force=false){
    if(state.glossary.length&&!force)return true;
    if(force){state.glossary=[];state.glossaryModel=''}
    setStatus('Building v2 terminology map from the full Persian transcript…');
    if(els.aiNote)els.aiNote.textContent='Building source-first terminology map…';
    try{
      const data=await jsonFetch(API+'/glossary',{
        method:'POST',
        body:JSON.stringify({videoTitle:state.title,segments:state.segments})
      });
      state.glossary=Array.isArray(data.glossary)?data.glossary:[];
      state.glossaryModel=data.resolvedModel||'';
      rememberCredentialSlot(data.credentialSlot);
      if(els.aiNote)els.aiNote.textContent='Glossary ready · '+state.glossary.length+' terms';
      await saveProject('glossary built');
      return true;
    }catch(err){
      state.glossary=[];
      state.glossaryModel='';
      if(els.aiNote)els.aiNote.textContent='Glossary unavailable; continuing with Persian source + video title only.';
      setStatus('Glossary step failed: '+(err.message||'unknown error')+' Continuing with title/source protection.','error');
      await saveProject('glossary unavailable');
      return false;
    }
  }

  const rememberCredentialSlot=slot=>{const n=Number(slot);if(Number.isInteger(n)&&n>0&&!state.aiCredentialSlotsUsed.includes(n))state.aiCredentialSlotsUsed.push(n)};
  async function sendSemanticAudit(payload,auditNo,totalAudits){
    const maxAttempts=2;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{
        return await jsonFetch(API+'/semantic-qc',{method:'POST',body:JSON.stringify(payload)});
      }catch(err){
        const retryable=err?.code==='NETWORK_FETCH_FAILED'||err?.status===502||err?.status===503||err?.status===504;
        if(!retryable||attempt===maxAttempts)throw err;
        setStatus('Semantic QC · group '+auditNo+'/'+totalAudits+' · retry '+(attempt+1)+'/'+maxAttempts+'…');
        await sleep(1200*attempt);
      }
    }
  }

  async function runSemanticAudit(){
    const auditSize=60,concurrency=3,total=state.segments.length,totalAudits=Math.ceil(total/auditSize);
    const tasks=[];
    for(let offset=0,auditNo=1;offset<total;offset+=auditSize,auditNo++){
      const group=state.segments.slice(offset,offset+auditSize);
      if(group.every(seg=>seg.semanticAudited))continue;
      tasks.push({offset,auditNo,group});
    }

    for(let waveStart=0;waveStart<tasks.length;waveStart+=concurrency){
      const wave=tasks.slice(waveStart,waveStart+concurrency);
      const labels=wave.map(task=>task.auditNo).join(', ');
      setStatus('Semantic QC · parallel groups '+labels+' / '+totalAudits+'…');

      const results=await Promise.allSettled(wave.map(task=>
        sendSemanticAudit({videoTitle:state.title,glossary:state.glossary,segments:task.group},task.auditNo,totalAudits)
      ));

      let firstError=null;
      for(let w=0;w<wave.length;w++){
        const task=wave[w],result=results[w];
        if(result.status!=='fulfilled'){
          firstError=firstError||result.reason;
          continue;
        }
        const data=result.value;
        rememberCredentialSlot(data.credentialSlot);
        if(data.resolvedModel&&!state.aiModels.includes(data.resolvedModel))state.aiModels.push(data.resolvedModel);

        const byId=new Map((data.segments||[]).map(item=>[Number(item.index),String(item.translatedText||'').trim()]));
        const ids=task.group.map(seg=>Number(seg.index));
        state.qcIssues=state.qcIssues.filter(issue=>!ids.includes(Number(issue.id)));
        const touched=[];
        for(const seg of task.group){
          const idx=state.segments.findIndex(item=>Number(item.index)===Number(seg.index));
          if(idx<0)continue;
          const text=byId.get(Number(seg.index));
          if(text)state.segments[idx].translatedText=text;
          state.segments[idx].semanticAudited=true;
          state.segments[idx].qcIssues=[];
          touched.push(idx);
        }
        for(const issue of (data.qc?.issues||[])){
          const enriched={...issue,semanticAudit:true};
          state.qcIssues.push(enriched);
          const idx=state.segments.findIndex(seg=>Number(seg.index)===Number(issue.id));
          if(idx>=0)state.segments[idx].qcIssues.push(enriched);
        }
        updateEnglishFields(touched);
      }

      const done=state.segments.filter(seg=>seg.semanticAudited).length;
      setProgress(done,total,'Semantic QC · '+done+'/'+total+' segments');
      await saveProject('semantic QC parallel wave');
      if(firstError)throw firstError;
    }

    state.semanticAuditComplete=state.segments.every(seg=>seg.semanticAudited);
    await saveProject('semantic QC complete',true);
    return state.semanticAuditComplete;
  }

  async function runFinalRepairs(){
    const severeById=new Map();
    for(const issue of state.qcIssues){
      if(issue?.severity!=='severe')continue;
      const id=Number(issue.id);
      if(!Number.isInteger(id))continue;
      if(!severeById.has(id))severeById.set(id,[]);
      severeById.get(id).push(issue);
    }
    const ids=[...severeById.keys()];
    if(!ids.length)return {attempted:0,failed:0,repaired:0};

    const chunkSize=30,maxCalls=2;
    const chunks=[];
    for(let i=0;i<ids.length&&chunks.length<maxCalls;i+=chunkSize)chunks.push(ids.slice(i,i+chunkSize));
    let failed=0,repaired=0;

    for(let i=0;i<chunks.length;i++){
      const groupIds=chunks[i];
      const segments=groupIds.map(id=>state.segments.find(seg=>Number(seg.index)===id)).filter(Boolean);
      const issues=groupIds.flatMap(id=>severeById.get(id)||[]);
      setStatus('Final QC repair · '+(i+1)+'/'+chunks.length+' · '+segments.length+' flagged segments…');

      let data;
      try{
        data=await sendAIRepair({
          videoTitle:state.title,
          glossary:state.glossary,
          segments,
          issues
        },i+1,chunks.length);
      }catch(err){
        failed++;
        state.qcRepairFailed=true;
        setStatus('Final QC repair '+(i+1)+'/'+chunks.length+' failed. Translation is already complete; continuing with the remaining repair groups.','error');
        await saveProject('QC repair failed '+(i+1)+'/'+chunks.length);
        continue;
      }

      rememberCredentialSlot(data.credentialSlot);
      if(data.resolvedModel&&!state.aiModels.includes(data.resolvedModel))state.aiModels.push(data.resolvedModel);

      const byId=new Map((data.segments||[]).map(item=>[Number(item.index),String(item.translatedText||'').trim()]));
      const touched=[];
      for(const id of groupIds){
        const idx=state.segments.findIndex(seg=>Number(seg.index)===id);
        if(idx<0)continue;
        const text=byId.get(id);
        if(text){
          state.segments[idx].translatedText=text;
          state.segments[idx].qcIssues=[];
          touched.push(idx);
          repaired++;
        }
      }
      updateEnglishFields(touched);

      state.qcIssues=state.qcIssues.filter(issue=>!groupIds.includes(Number(issue.id)));
      for(const issue of (data.qc?.issues||[])){
        const enriched={...issue,finalRepair:true};
        state.qcIssues.push(enriched);
        const idx=state.segments.findIndex(seg=>Number(seg.index)===Number(issue.id));
        if(idx>=0){
          if(!Array.isArray(state.segments[idx].qcIssues))state.segments[idx].qcIssues=[];
          state.segments[idx].qcIssues.push(enriched);
        }
      }
      state.qcFinalRepairCalls++;
      await saveProject('QC repair '+(i+1)+'/'+chunks.length);
    }

    if(ids.length>chunks.length*chunkSize)state.qcRepairFailed=true;
    return {attempted:chunks.length,failed,repaired};
  }

  async function sendAIRepair(payload,repairNo,totalRepairs){
    const maxAttempts=2;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{
        return await jsonFetch(API+'/repair',{method:'POST',body:JSON.stringify(payload)});
      }catch(err){
        const retryable=err?.code==='NETWORK_FETCH_FAILED'||err?.status===502||err?.status===503||err?.status===504;
        if(!retryable||attempt===maxAttempts)throw err;
        setStatus('Final QC repair · '+repairNo+'/'+totalRepairs+' · retry '+(attempt+1)+'/'+maxAttempts+'…');
        await sleep(1200*attempt);
      }
    }
  }

  async function checkBackend(){
    try{
      const data=await jsonFetch(`${API}/health`,{headers:{}});
      state.aiConfigured=Boolean(data.aiConfigured);
      state.aiCredentialCount=Number(data.aiCredentialSlots||0);
      state.projectStorage=Boolean(data.projectStorage);
      els.apiState.textContent=data?.status==='ok'?'Backend online':'Backend reachable';
      els.apiDot.style.background='#2bb673';
      if(els.aiTranslate)els.aiTranslate.disabled=!state.aiConfigured;
      if(els.aiNote)els.aiNote.textContent=state.aiConfigured?('Ready for timing-aware English rewrite · '+state.aiCredentialCount+' credential'+(state.aiCredentialCount===1?'':'s')+'.'):'AI provider is not configured yet.';
      if(els.projectMemoryNote)els.projectMemoryNote.textContent=state.projectStorage?'R2 cloud project storage ready.':'Cloud project storage not ready; local cache fallback active.';
      return true;
    }catch(_){
      state.aiConfigured=false;
      els.apiState.textContent='Backend not deployed yet';
      els.apiDot.style.background='#d29b2c';
      if(els.aiTranslate)els.aiTranslate.disabled=true;
      return false;
    }
  }
  async function checkAuth(){
    try{
      const data=await jsonFetch(API+'/oauth/status',{headers:{}});
      state.auth=Boolean(data.connected);
      state.youtubeAccessValid=Boolean(data.youtubeAccessValid);
      state.csrf=data.csrfToken||null;
      els.authPill.textContent=state.auth?(state.youtubeAccessValid?'Connected':'Project session active'):'Not connected';
      els.authPill.classList.toggle('connected',state.auth);
      els.connect.hidden=state.youtubeAccessValid;
      els.disconnect.hidden=!state.auth;
      els.privateContent.forEach(el=>{el.hidden=!state.auth});
      els.accountNote.textContent=state.auth
        ? (state.youtubeAccessValid
            ? (data.channel?.title?'Connected privately to '+data.channel.title+'. Project/AI session stays active for long jobs.':'Private project session is active.')
            : 'Project/AI session is still active. Reconnect YouTube only before fetching fresh captions.')
        : 'Private tool: connect the authorized YouTube account to unlock it.';
    }catch(_){
      state.auth=false;
      state.youtubeAccessValid=false;
      state.csrf=null;
      els.privateContent.forEach(el=>{el.hidden=true});
      els.authPill.textContent='Backend required';
      els.connect.hidden=false;
      els.disconnect.hidden=true;
    }
  }
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
  function syncEdit(e){const t=e.target;if(!t.matches('textarea[data-index][data-field]'))return;const i=Number(t.dataset.index),field=t.dataset.field;if(!state.segments[i]||!field)return;state.segments[i][field]=t.value;if(field==='sourceText'){state.glossary=[];state.glossaryModel='';state.segments[i].aiAdapted=false;state.segments[i].semanticAudited=false;state.segments[i].qcIssues=[];state.aiComplete=false;state.semanticAuditComplete=false}document.querySelectorAll(`textarea[data-index="${i}"][data-field="${field}"]`).forEach(o=>{if(o!==t)o.value=t.value});refreshExportLabels();queueAutosave('manual edit')}
  els.body?.addEventListener('input',syncEdit);els.mobile?.addEventListener('input',syncEdit);
  els.projectOpen?.addEventListener('click',async()=>{
    const id=els.projectList?.value||'';
    if(!id){setStatus('Choose a saved project first.','error');return}
    const project=await getSavedProject(id);
    if(!project){setStatus('That saved project could not be found.','error');await refreshProjectList();return}
    restoreProject(project);
    await saveProject('opened and reconciled project',true);
    setStatus('Loaded the newest saved project and synced project memory. No YouTube or AI request was used.','success');
  });

  els.projectImport?.addEventListener('click',()=>els.projectFile?.click());
  els.projectFile?.addEventListener('change',async()=>{
    const file=els.projectFile.files?.[0];
    if(!file)return;
    try{
      const project=JSON.parse(await file.text());
      restoreProject(project);
      await saveProject('imported project',true);
      setStatus('Project JSON imported and saved to project memory.','success');
    }catch(err){
      setStatus('Could not import this Project JSON: '+(err?.message||'invalid file'),'error');
    }finally{
      els.projectFile.value='';
    }
  });

  els.projectRefresh?.addEventListener('click',()=>{
    state.forceYoutubeRefresh=true;
    els.load?.click();
  });

  els.connect?.addEventListener('click',()=>{location.href=`${API}/oauth/start?return_to=${encodeURIComponent('/tldub/')}`});
  els.disconnect?.addEventListener('click',async()=>{try{await jsonFetch(`${API}/oauth/logout`,{method:'POST',body:'{}'})}catch(_){}state.csrf=null;state.segments=[];els.results.hidden=true;await checkAuth();setStatus('YouTube disconnected and access token revoked.')});
  els.load?.addEventListener('click',async()=>{
    const url=els.videoUrl.value.trim();
    if(!url){setStatus('Paste a YouTube video URL first.','error');return}
    const videoId=clientVideoId(url);
    if(!videoId){setStatus('Paste a valid YouTube video URL.','error');return}

    const forceRefresh=Boolean(state.forceYoutubeRefresh);
    state.forceYoutubeRefresh=false;
    els.load.disabled=true;

    try{
      if(!forceRefresh){
        const saved=await getSavedProject(videoId);
        if(saved){
          restoreProject(saved);
          await saveProject('URL load reconciled project',false);
          await refreshProjectList(videoId);
          setStatus('Loaded the newest saved project. No YouTube or AI request was used.','success');
          return;
        }
      }

      setStatus(forceRefresh?'Refreshing captions from YouTube…':'Reading caption tracks from YouTube…');
      const data=await jsonFetch(`${API}/transcript`,{method:'POST',body:JSON.stringify({url,sourceLanguage:'fa',targetLanguage:'en',translate:els.translate.checked})});
      state.segments=data.segments||[];
      state.videoId=data.videoId||videoId;
      state.title=data.title||'YouTube video';
      state.translationSource=data.translationSource||'';
      state.projectCreatedAt=null;
      state.projectFolderName=safeFolderName(state.title,state.videoId);
      state.projectOriginalUrl=url;
      if(!state.segments.length)throw new Error('No caption segments were returned.');
      snapshotYouTubeEnglish();
      hideProgress();
      render();
      await saveProject('captions loaded',true);
      setStatus(`Loaded and saved ${state.segments.length} timed segments${data.translationSource?` · English: ${data.translationSource}`:''}.`,'success');
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

    const allAlreadyAdapted=state.segments.length>0&&state.segments.every(seg=>seg.aiAdapted);
    const severePending=state.qcIssues.filter(issue=>issue.severity==='severe').length;

    if(allAlreadyAdapted&&Number(state.pipelineVersion||1)>=2&&!state.semanticAuditComplete){
      state.aiRunning=true;
      refreshExportLabels();
      els.aiTranslate.disabled=true;
      els.aiTranslate.textContent='Semantic QC…';
      els.load.disabled=true;
      try{
        await runSemanticAudit();
        const severeAfterAudit=state.qcIssues.filter(issue=>issue.severity==='severe').length;
        if(severeAfterAudit){
          setStatus('Semantic QC complete · '+severeAfterAudit+' severe issue(s) found · starting final repair…');
          await runFinalRepairs();
        }
        state.aiComplete=state.segments.every(seg=>seg.aiAdapted)&&state.semanticAuditComplete;
        const severeLeft=state.qcIssues.filter(issue=>issue.severity==='severe').length;
        const warningsLeft=state.qcIssues.filter(issue=>issue.severity!=='severe').length;
        if(els.aiNote)els.aiNote.textContent='v2 · semantic QC complete · '+severeLeft+' severe / '+warningsLeft+' warnings';
        setStatus(severeLeft?'Semantic QC completed, but '+severeLeft+' severe issue(s) remain.':'Translation, semantic QC, and final repair are complete.',severeLeft?'error':'success');
        await saveProject('semantic QC resumed and completed',true);
      }catch(err){
        state.semanticAuditComplete=state.segments.every(seg=>seg.semanticAudited);
        setStatus('Semantic QC paused: '+(err.message||'unknown error')+'. Progress is saved; resume from the next group.','error');
        await saveProject('semantic QC paused',true);
      }finally{
        state.aiRunning=false;
        els.aiTranslate.disabled=!state.aiConfigured;
        els.load.disabled=false;
        refreshExportLabels();
      }
      return;
    }

    if(allAlreadyAdapted&&severePending>0){
      state.aiRunning=true;
      state.qcRepairFailed=false;
      refreshExportLabels();
      els.aiTranslate.disabled=true;
      els.aiTranslate.textContent='Repairing QC…';
      els.load.disabled=true;
      setProgress(state.segments.length,state.segments.length,'Translation complete · QC repair');

      try{
        setStatus('Translation is already complete · retrying final QC repair for '+severePending+' severe issue(s)…');
        const summary=await runFinalRepairs();
        const severeLeft=state.qcIssues.filter(issue=>issue.severity==='severe').length;
        const warningsLeft=state.qcIssues.filter(issue=>issue.severity!=='severe').length;
        state.qcRepairFailed=summary.failed>0||severeLeft>0;
        const modelText=state.aiModels.length?state.aiModels.join(', '):'OpenRouter free router';
        const credentialText=state.aiCredentialSlotsUsed.length?('credentials used #'+state.aiCredentialSlotsUsed.sort((a,b)=>a-b).join(', #')):'credential usage unavailable';
        if(els.aiNote)els.aiNote.textContent='Translation complete · final repair '+state.qcFinalRepairCalls+' call(s) · QC '+severeLeft+' severe / '+warningsLeft+' warnings · '+credentialText+' · models: '+modelText;
        setStatus(severeLeft?'Translation remains complete, but '+severeLeft+' severe QC issue(s) still need repair.':'Translation and final QC repair are complete.',severeLeft?'error':'success');
        await saveProject('final QC retry',true);
      }catch(err){
        state.qcRepairFailed=true;
        setStatus('Translation is complete, but final QC repair could not finish: '+(err.message||'unknown error'),'error');
        await saveProject('final QC retry failed',true);
      }finally{
        state.aiRunning=false;
        els.aiTranslate.disabled=!state.aiConfigured;
        els.load.disabled=false;
        refreshExportLabels();
      }
      return;
    }

    if(state.aiComplete){
      state.previousEnglishBackup={
        createdAt:new Date().toISOString(),
        translationSource:state.translationSource,
        pipelineVersion:Number(state.pipelineVersion||1),
        segments:state.segments.map(seg=>({index:Number(seg.index),translatedText:String(seg.translatedText||'')}))
      };
      state.segments.forEach(seg=>{seg.aiAdapted=false;seg.semanticAudited=false;seg.qcIssues=[]});
      state.aiComplete=false;
      state.semanticAuditComplete=false;
      state.pipelineVersion=2;
      state.semanticAuditComplete=false;
      state.translationSource='AI dubbing adaptation v2 · reprocessing';
      state.aiModels=[];
      state.glossary=[];
      state.glossaryModel='';
      state.qcIssues=[];
      state.qcRepairBatches=0;
      state.qcRepairSkippedBatches=0;
      state.qcFinalRepairCalls=0;
      state.qcRepairFailed=false;
      state.aiCredentialSlotsUsed=[];
      await saveProject('v2 reprocess backup created',true);
      if(els.aiNote)els.aiNote.textContent='Previous English backed up · starting context-first v2 reprocess.';
    } else if(Number(state.pipelineVersion||1)<2&&state.segments.some(seg=>seg.aiAdapted)){
      state.previousEnglishBackup={
        createdAt:new Date().toISOString(),
        translationSource:state.translationSource,
        pipelineVersion:Number(state.pipelineVersion||1),
        segments:state.segments.map(seg=>({index:Number(seg.index),translatedText:String(seg.translatedText||'')}))
      };
      state.segments.forEach(seg=>{seg.aiAdapted=false;seg.semanticAudited=false;seg.qcIssues=[]});
      state.pipelineVersion=2;
      state.translationSource='AI dubbing adaptation v2 · reprocessing';
      state.aiModels=[];
      state.glossary=[];
      state.glossaryModel='';
      state.qcIssues=[];
      state.qcRepairBatches=0;
      state.qcRepairSkippedBatches=0;
      state.qcFinalRepairCalls=0;
      state.qcRepairFailed=false;
      state.aiCredentialSlotsUsed=[];
      await saveProject('v2 partial reprocess backup created',true);
    }

    if(Number(state.pipelineVersion||1)<2)state.pipelineVersion=2;
    state.aiRunning=true;
    refreshExportLabels();
    els.aiTranslate.disabled=true;
    els.aiTranslate.textContent='Adapting…';
    els.load.disabled=true;

    await ensureGlossary(Number(state.pipelineVersion||1)>=2&&!state.glossary.length);

    const batchSize=30,concurrency=3,total=state.segments.length,totalBatches=Math.ceil(total/batchSize);
    let completed=state.segments.filter(s=>s.aiAdapted).length;
    setProgress(completed,total,Math.ceil(completed/batchSize)+'/'+totalBatches+' batches · '+completed+'/'+total+' segments');
    setStatus('AI v2 context-first adaptation · preparing parallel batches…');

    try{
      const tasks=[];
      for(let offset=0,batchNo=1;offset<total;offset+=batchSize,batchNo++){
        const batch=state.segments.slice(offset,offset+batchSize);
        if(batch.every(seg=>seg.aiAdapted))continue;
        tasks.push({
          offset,
          batchNo,
          batch,
          contextBefore:state.segments.slice(Math.max(0,offset-5),offset),
          contextAfter:state.segments.slice(offset+batch.length,offset+batch.length+5)
        });
      }

      for(let waveStart=0;waveStart<tasks.length;waveStart+=concurrency){
        const wave=tasks.slice(waveStart,waveStart+concurrency);
        const labels=wave.map(task=>task.batchNo).join(', ');
        setStatus('AI v2 adaptation · parallel batches '+labels+' / '+totalBatches+'…');

        const results=await Promise.allSettled(wave.map(task=>
          sendAIBatch(
            {segments:task.batch,contextBefore:task.contextBefore,contextAfter:task.contextAfter,singleBatch:true,videoTitle:state.title,glossary:state.glossary,pipelineVersion:2},
            task.batchNo,
            totalBatches
          )
        ));

        let firstError=null;
        const touched=[];
        for(let w=0;w<wave.length;w++){
          const task=wave[w],result=results[w];
          if(result.status!=='fulfilled'){
            firstError=firstError||result.reason;
            continue;
          }

          const data=result.value;
          const ids=task.batch.map(seg=>Number(seg.index));
          state.qcIssues=state.qcIssues.filter(issue=>!ids.includes(Number(issue.id)));
          const byId=new Map((data.segments||[]).map(item=>[Number(item.index),item.translatedText]));

          for(let local=0;local<task.batch.length;local++){
            const globalIndex=task.offset+local;
            const seg=state.segments[globalIndex];
            const text=byId.get(Number(seg.index));
            if(typeof text==='string'&&text.trim()){
              seg.translatedText=text.trim();
              seg.aiAdapted=true;
              seg.semanticAudited=false;
              seg.qcIssues=[];
              touched.push(globalIndex);
            }
          }

          for(const model of (data.resolvedModels||[])){if(model&&!state.aiModels.includes(model))state.aiModels.push(model)}
          for(const slot of (data.credentialSlots||[]))rememberCredentialSlot(slot);
          if(data.qc?.repaired)state.qcRepairBatches++;
          if(data.qc?.repairSkipped)state.qcRepairSkippedBatches++;
          for(const issue of (data.qc?.issues||[])){
            const enriched={...issue,batch:task.batchNo};
            state.qcIssues.push(enriched);
            const idx=state.segments.findIndex(seg=>Number(seg.index)===Number(issue.id));
            if(idx>=0){
              if(!Array.isArray(state.segments[idx].qcIssues))state.segments[idx].qcIssues=[];
              state.segments[idx].qcIssues.push(enriched);
            }
          }
        }

        completed=state.segments.filter(s=>s.aiAdapted).length;
        updateEnglishFields(touched);
        refreshExportLabels();
        setProgress(completed,total,Math.ceil(completed/batchSize)+'/'+totalBatches+' batches · '+completed+'/'+total+' segments');
        await saveProject('AI parallel batch wave');
        if(firstError)throw firstError;
      }

      state.translationSource='AI dubbing adaptation v2';
      state.aiComplete=false;
      refreshExportLabels();

      setStatus('Translation pass complete · starting independent semantic QC…');
      await runSemanticAudit();
      state.aiComplete=state.segments.every(s=>s.aiAdapted)&&state.semanticAuditComplete;
      refreshExportLabels();

      const severeBeforeRepair=state.qcIssues.filter(issue=>issue.severity==='severe').length;
      if(severeBeforeRepair){
        setStatus('Translation complete · '+severeBeforeRepair+' severe QC issue(s) found · starting final repair…');
        const repairSummary=await runFinalRepairs();
        if(repairSummary.failed>0){
          state.qcRepairFailed=true;
        }
      }

      refreshExportLabels();
      const modelText=state.aiModels.length?state.aiModels.join(', '):'OpenRouter free router';
      const severe=state.qcIssues.filter(issue=>issue.severity==='severe').length;
      const warnings=state.qcIssues.filter(issue=>issue.severity!=='severe').length;
      const glossaryText=state.glossary.length?state.glossary.length+' glossary terms':'title/source context only';
      const credentialText=state.aiCredentialSlotsUsed.length?('credentials used #'+state.aiCredentialSlotsUsed.sort((a,b)=>a-b).join(', #')):'credential usage unavailable';
      if(els.aiNote)els.aiNote.textContent='v2 complete · '+glossaryText+' · semantic/timing QC '+severe+' severe / '+warnings+' warnings · final repair '+state.qcFinalRepairCalls+' call(s) · '+credentialText+' · models: '+modelText;
      setProgress(total,total,'Complete · '+total+'/'+total+' segments');
      render();
      setStatus((severe?'AI translation is complete. Final QC still has '+severe+' severe issue(s); use Retry final QC repair before TTS.':'AI v2 adaptation complete and passed severe semantic/timing QC checks.')+' '+total+' segments updated.',severe?'error':'success');
      await saveProject('AI adaptation complete',true);
    }catch(err){
      completed=state.segments.filter(s=>s.aiAdapted).length;
      const msg=err.message||'Could not adapt the English script.';
      const audited=state.segments.filter(s=>s.semanticAudited).length;
      const partial=completed===total&&!state.semanticAuditComplete?' Translation is complete; semantic QC progress '+audited+'/'+total+' is saved and will resume.':completed===total?' Translation is complete; only final QC may need retry.':completed>0?' '+completed+'/'+total+' segments are already saved in this page; Resume will continue from the next batch.':'';
      if(/auth|connect|authorization|401|expired|security token/i.test(msg)){state.auth=false;state.csrf=null;els.privateContent.forEach(el=>{el.hidden=true})}
      setStatus(msg+partial,'error');
      if(els.aiNote)els.aiNote.textContent='Stopped while sending the already-loaded transcript to AI: '+msg;
      refreshExportLabels();
      await saveProject('AI adaptation paused',true);
    }finally{
      state.aiRunning=false;
      els.aiTranslate.disabled=!state.aiConfigured;
      els.load.disabled=false;
      refreshExportLabels();
    }
  });

  els.restoreYoutube?.addEventListener('click',()=>{
    if(!state.youtubeEnglish.length||state.youtubeEnglish.length!==state.segments.length)return;
    state.segments.forEach((seg,i)=>{seg.translatedText=state.youtubeEnglish[i]||'';seg.aiAdapted=false;seg.semanticAudited=false});
    state.translationSource='YouTube machine translation';
    state.aiComplete=false;
    state.semanticAuditComplete=false;
    state.pipelineVersion=1;
    state.previousEnglishBackup=null;
    state.aiModels=[];
    state.qcIssues=[];
    state.qcRepairBatches=0;
    state.qcRepairSkippedBatches=0;
    state.qcFinalRepairCalls=0;
    state.qcRepairFailed=false;
    state.aiCredentialSlotsUsed=[];
    state.segments.forEach(seg=>{seg.qcIssues=[]});
    hideProgress();
    render();
    setStatus('Restored the original YouTube English translation.','success');
    if(els.aiNote)els.aiNote.textContent='Ready for timing-aware English rewrite.';
    saveProject('restored YouTube English',true);
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
      case'json':download(id+'.tldub.json',JSON.stringify(buildProjectSnapshot(),null,2),'application/json;charset=utf-8');break;
    }
  });
  const params=new URLSearchParams(location.search);if(params.get('oauth')==='ok'){history.replaceState({},'','/tldub/');setStatus('YouTube connected. Paste a video URL.','success')}if(params.get('oauth_error')){const m=params.get('oauth_error');history.replaceState({},'','/tldub/');setStatus(m||'YouTube authorization failed.','error')}
  (async()=>{await checkBackend();await checkAuth();await refreshProjectList();if(state.auth)await restoreLastProject()})();
})();