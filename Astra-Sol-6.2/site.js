"use strict";
(function () {
  const items = [
    {
      id:"goldberg", number:"01", title:{en:"The Rube Goldberg machine",fa:"ماشین واکنش زنجیره‌ای"},
      desc:{en:"Six physical-looking events, one continuous chain of consequences.",fa:"6 اتفاق پشت‌سرهم؛ از حرکت توپ تا بالا رفتن پرچم موفقیت."},
      winner:"ASTRA 6.2",
      result:{en:"Astra 6.2 offers stronger evidence of explicit event timing and causal sequencing in the provided source files. Both renders are visually complete; neither is proof of a fully physics-driven simulation.",fa:"آسترا 6.2 در سورس تحویلی زمان‌بندی و توالی اتفاق‌ها رو دقیق‌تر مشخص کرده. هر 2 خروجی کامل به نظر می‌رسن، ولی هیچ‌کدوم به‌تنهایی اثبات یک شبیه‌سازی فیزیکی آزاد نیستن."},
      files:[
        {model:"SOL 6.2",score:"8.5",src:"media/goldberg-sol62.mp4",poster:"assets/goldberg-sol62.jpg",meta:"25s · 720p · 24fps",style:"s"},
        {model:"ASTRA 6.2",score:"9.0",src:"media/goldberg-astra62.mp4",poster:"assets/goldberg-astra62.jpg",meta:"25s · 1080p · 30fps",style:"a"}
      ],
      prompt:[
        "Create a visually stunning 3D Rube Goldberg machine as a polished 25-second animation.",
        "",
        "The machine must complete these six stages in order:",
        "1. A steel marble rolls down a spiral track.",
        "2. It knocks over a row of five dominoes.",
        "3. The final domino releases a counterweight.",
        "4. The counterweight rotates a gear mechanism.",
        "5. The mechanism activates a small hammer that rings a bell.",
        "6. The bell mechanism releases a miniature flag reading \"SUCCESS\".",
        "",
        "Each stage must causally trigger the next. No teleportation or arbitrary timed shortcuts.",
        "",
        "Use elegant wooden and brass components, smooth cinematic camera movement, realistic lighting, and physically plausible motion.",
        "",
        "Deliver a working, viewable animation, not a website, application, or game. Verify that the complete sequence works before finishing."
      ].join("\n")
    },
    {
      id:"penrose",number:"02",title:{en:"The impossible staircase",fa:"پلکان غیرممکن"},
      desc:{en:"A forced-perspective illusion that breaks apart as the camera moves.",fa:"یک خطای دید سه‌بعدی که با چرخیدن دوربین، راز ساختارش معلوم می‌شه."},
      winner:"SOL 6.2",
      result:{en:"Sol 6.2 has the stronger visual presentation and smoother 60 fps camera movement. Neither result completely sells the impossible-loop illusion from the starting view.",fa:"سول 6.2 از نظر کیفیت نمایش و حرکت نرم‌تر دوربین برتری داره. بااین‌حال هیچ‌کدوم از نمای اول، توهم یک پلکان غیرممکن رو کاملاً بی‌نقص اجرا نکردن."},
      files:[
        {model:"SOL 6.2",score:"8.5",src:"media/penrose-sol62.mp4",poster:"assets/penrose-sol62.jpg",meta:"19.2s · 1080p · 60fps",style:"s"},
        {model:"ASTRA 6.2",score:"8.0",src:"media/penrose-astra62.mp4",poster:"assets/penrose-astra62.jpg",meta:"20s · 1080p · 30fps",style:"a"}
      ],
      prompt:[
        "Create a high-quality 3D optical illusion featuring a Penrose impossible staircase.",
        "",
        "From the initial camera angle, the staircase must appear to form a continuous impossible loop, with every step seemingly ascending in the same direction.",
        "",
        "A small red marble should travel along the visible staircase path.",
        "",
        "After 8 seconds, slowly rotate the camera around the structure to reveal how the illusion is constructed using separated architectural segments and forced perspective.",
        "",
        "Then return to the exact initial camera position so the impossible staircase becomes visually convincing again.",
        "",
        "Use minimalist concrete architecture, soft shadows, and cinematic lighting.",
        "",
        "This must be genuine 3D geometry, not a flat image or video texture.",
        "",
        "Deliver a smooth 15–20 second visual demonstration, not a website or application."
      ].join("\n")
    },
    {
      id:"clock",number:"03",title:{en:"The skeleton clock",fa:"ساعت مکانیکی شفاف"},
      desc:{en:"An exploded-view animation with interacting gears and reassembly.",fa:"جداسازی قطعات، نمایش چرخ‌دنده‌ها و مونتاژ دوباره یک ساعت."},
      winner:"ASTRA 6.2",
      result:{en:"Astra 6.2 provides gear relationships, rotation logic, and source-side mechanical checks alongside its render. Sol's video is visually engaging, but no corresponding technical source was included for independent validation.",fa:"آسترا 6.2 همراه ویدیو، محاسبه نسبت چرخ‌دنده‌ها، جهت دوران و بررسی‌های هندسی هم داده. خروجی سول از نظر ظاهری جذابه، ولی سورس فنی مشابهی برای راستی‌آزمایی همراهش نبوده."},
      files:[
        {model:"SOL 6.2",score:"7.5",src:"media/clock-sol62.mp4",poster:"assets/clock-sol62.jpg",meta:"12s · 1080p · 24fps",style:"s"},
        {model:"ASTRA 6.2",score:"9.0",src:"media/clock-astra62.mp4",poster:"assets/clock-astra62.jpg",meta:"12s · 1080p · 30fps",style:"a"}
      ],
      prompt:[
        "Create a detailed animated 3D skeleton clock mechanism.",
        "",
        "The clock must contain multiple interconnected gears with physically consistent tooth counts, gear ratios, rotation directions, and center distances.",
        "",
        "Start with the fully assembled mechanism running.",
        "",
        "Then create a smooth exploded-view animation in which the components separate along their assembly axes, revealing their internal structure.",
        "",
        "After 5 seconds, reassemble the mechanism automatically and resume the correct gear movement.",
        "",
        "Make the materials visually distinct: polished brass gears, brushed steel shafts, glass covers, and dark metal structural plates.",
        "",
        "Include a slowly moving cinematic camera.",
        "",
        "Prioritize mechanical correctness over decorative complexity. No intersecting gears, disconnected shafts, or incorrect rotation directions.",
        "",
        "Deliver a viewable 3D animation, not an application or website."
      ].join("\n")
    },
    {
      id:"intro",number:"04",title:{en:"TunnelLab motion graphics",fa:"موشن‌گرافیک تونل‌لب"},
      desc:{en:"Typography, RTL Persian shaping, motion design and visual identity.",fa:"طراحی هویت بصری، تایپوگرافی فارسی و ترنزیشن‌های موشن‌گرافیک."},
      winner:"SOL 6.2",
      result:{en:"Sol 6.2's initial render is closer to the flat, restrained visual language of TunnelLab. Astra 6.2's initial render is legible but puts more emphasis on a large sculptural tunnel element. Astra 6 is evaluated separately below.",fa:"خروجی سول 6.2 در مقایسه با آسترا 6.2 به هویت بصری روشن و تخت تونل‌لب نزدیک‌تره. خروجی آسترا 6.2 متن فارسی رو درست نمایش می‌ده، ولی عنصر تونل خیلی بزرگ‌تره. خروجی آسترا 6 جداگانه پایین صفحه بررسی شده."},
      files:[
        {model:"SOL 6.2",score:"8.5",src:"media/intro-sol62.mp4",poster:"assets/intro-sol62.jpg",meta:"12s · 1080p · 30fps",style:"s"},
        {model:"ASTRA 6.2",score:"7.5",src:"media/intro-astra62.mp4",poster:"assets/intro-astra62.jpg",meta:"12s · 1080p · 30fps",style:"a"}
      ],
      prompt:[
        "Create a premium 12-second motion graphics intro for a Persian-language technology YouTube channel called TunnelLab.",
        "",
        "Visual direction:",
        "- 1920x1080, 16:9.",
        "- Bright ivory background.",
        "- Black typography with restrained yellow accents.",
        "- Clean editorial graphic design.",
        "- Bold geometric compositions.",
        "- Carefully choreographed typography animations.",
        "- Sophisticated easing, transitions, and visual rhythm.",
        "- Absolutely no generic AI imagery, robot illustrations, neon cyberpunk effects, or human characters.",
        "",
        "Use the Vazirmatn font for Persian typography.",
        "",
        "The sequence should reveal the channel name, then a bold Persian title, and finish on a memorable graphic composition.",
        "",
        "The Persian title must read exactly:",
        "هوش مصنوعی زیر ذره‌بین",
        "",
        "Ensure accurate right-to-left typography and proper Persian letter shaping.",
        "",
        "Produce a finished animation or video file, not a presentation, website, or application.",
        "",
        "Prioritize art direction and motion design quality over complexity."
      ].join("\n")
    }
  ];
  const versionFiles=[
    {model:"ASTRA 6.2",score:"7.5",src:"media/intro-astra62.mp4",poster:"assets/intro-astra62.jpg",meta:"TunnelLab Intro.mp4 · 1080p / 30fps",style:"a"},
    {model:"ASTRA 6",score:"9.0",src:"media/intro-astra6.mp4",poster:"assets/intro-astra6.jpg",meta:"TunnelLab-Premium-Intro.mp4 · 1080p / 60fps",style:"v"}
  ];
  let lang="en";
  const t=(obj)=>obj[lang];
  const escapeHTML=(v)=>String(v).replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  const mediaCard=(item)=>{
    const cdn="https://cdn.jsdelivr.net/gh/pouramin/Astra-Sol-6.2@main/";
    const label=escapeHTML(item.model),src=escapeHTML(cdn+item.src),poster=escapeHTML(cdn+item.poster);
    const missing=lang==="fa"?"ویدیو هنوز روی این نسخه از سایت بارگذاری نشده":"Video not available on this deployment";
    const help=lang==="fa"?"فایل ویدیو باید در پوشه رسانه‌ها قرار بگیره.":"The media asset needs to be published.";
    return '<div class="video-card"><div class="video-card-head"><span class="model '+item.style+'">'+label+'</span><span class="video-meta">'+escapeHTML(item.meta)+' · '+escapeHTML(item.score)+'/10</span></div><div class="video-frame"><video playsinline controls preload="metadata" muted poster="'+poster+'" aria-label="'+label+' video"><source src="'+src+'" type="video/mp4"></video><div class="media-error"><b>'+missing+'</b><small>'+help+'</small></div></div></div>';
  };
  const pairHTML=(files,idx)=>'<div class="pair" data-pair="'+escapeHTML(idx)+'">'+files.map(mediaCard).join('')+'</div><div class="pair-tools"><button type="button" class="small-action both" data-action="play">'+(lang==="fa"?"▶ پخش هر 2":"▶ Play both")+'</button><button type="button" class="small-action both" data-action="pause">'+(lang==="fa"?"Ⅱ توقف هر 2":"Ⅱ Pause both")+'</button><button type="button" class="small-action both" data-action="restart">'+(lang==="fa"?"↺ پخش از اول":"↺ Restart")+'</button><span class="muted">'+(lang==="fa"?"صدا در شروع خاموشه.":"Muted by default.")+'</span></div>';
  function renderExperiments(){
    const box=document.getElementById("experiment-list"); box.innerHTML=items.map(item=>
      '<article class="experiment" id="challenge-'+item.id+'"><div class="exp-head"><div><span class="exp-id">EXPERIMENT '+item.number+'</span><h3>'+escapeHTML(t(item.title))+'</h3><p>'+escapeHTML(t(item.desc))+'</p></div><span class="judge">'+(lang==="fa"?"برتری نسبی":"Editorial edge")+' · '+item.winner+'</span></div>'+
      pairHTML(item.files,item.id)+
      '<div class="exp-comment"><div class="insight-title">'+(lang==="fa"?"نتیجه بررسی":"OBSERVATION")+'</div><p>'+escapeHTML(t(item.result))+'</p></div></article>'
    ).join("");
    document.getElementById("version-pair").innerHTML='<div class="experiment">'+pairHTML(versionFiles,"versions")+'</div>';
    document.querySelectorAll("video").forEach(video=>{
      video.addEventListener("error",()=>video.closest(".video-frame").classList.add("error"));
      const src=video.querySelector("source");
      if(src)src.addEventListener("error",()=>video.closest(".video-frame").classList.add("error"));
      video.addEventListener("loadeddata",()=>video.closest(".video-frame").classList.remove("error"));
    });
    document.querySelectorAll(".both").forEach(btn=>btn.addEventListener("click",()=>{
      const tools=btn.closest(".pair-tools"),videos=[...tools.previousElementSibling.querySelectorAll("video")];
      const action=btn.dataset.action;
      videos.forEach(v=>{if(action==="pause")v.pause();else if(action==="restart"){v.pause();v.currentTime=0;}});
      if(action!=="pause")videos.forEach(v=>{if(action==="play")v.currentTime=0;v.play().catch(()=>{});});
    }));
  }
  function renderPrompts(){
    const box=document.getElementById("prompt-list");
    box.innerHTML=items.map((item,index)=>
      '<details class="prompt-item" '+(index===0?'open':'')+'><summary><span><span class="prompt-count">'+item.number+'</span><span class="prompt-title">'+escapeHTML(t(item.title))+'</span></span></summary><div class="code-wrap"><button class="copy-btn" type="button" data-copy="'+item.id+'">'+(lang==="fa"?"کپی متن اصلی انگلیسی":"Copy original prompt")+'</button><pre class="prompt-code">'+escapeHTML(item.prompt)+'</pre></div>'+(lang==="fa" && window.TL_PROMPT_FA ? '<details class="prompt-translation"><summary>ترجمه فارسی پرامپت</summary><pre>'+escapeHTML(window.TL_PROMPT_FA[item.id])+'</pre></details>' : '')+'</details>'
    ).join("");
    box.querySelectorAll("[data-copy]").forEach(button=>button.addEventListener("click",()=>{
      const item=items.find(x=>x.id===button.dataset.copy);
      if(!item)return;
      if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(item.prompt).then(()=>showToast(lang==="fa"?"پرامپت کپی شد":"Prompt copied")).catch(()=>fallbackCopy(item.prompt));}
      else fallbackCopy(item.prompt);
    }));
  }
  function fallbackCopy(value){
    const el=document.createElement("textarea");el.value=value;el.style.position="fixed";el.style.opacity="0";document.body.append(el);el.select();const ok=document.execCommand("copy");el.remove();showToast(ok?(lang==="fa"?"پرامپت کپی شد":"Prompt copied"):(lang==="fa"?"کپی نشد":"Copy failed"));
  }
  let toastTimer;
  function showToast(s){const el=document.getElementById("toast");el.textContent=s;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);}
  function switchLang(next){
    lang=next;document.documentElement.lang=next;document.documentElement.dir=next==="fa"?"rtl":"ltr";
    document.querySelectorAll("[data-en][data-fa]").forEach(el=>el.textContent=el.dataset[next]);
    document.querySelectorAll(".lang").forEach(btn=>{const current=btn.dataset.lang===next;btn.classList.toggle("active",current);btn.setAttribute("aria-pressed",String(current));});
    renderExperiments();renderPrompts();
    try{localStorage.setItem("tunnellab-astra-sol-language",lang);}catch(_){}
  }
  document.querySelectorAll(".lang").forEach(btn=>btn.addEventListener("click",()=>switchLang(btn.dataset.lang)));
  // English is the guaranteed first-visit default; an explicit prior selection may be restored.
  let saved="en";try{saved=localStorage.getItem("tunnellab-astra-sol-language")==="fa"?"fa":"en";}catch(_){}
  switchLang(saved);
})();
