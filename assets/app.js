
(() => {
  const root = document.documentElement;
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];

  let storedTheme = null;
  try { storedTheme = localStorage.getItem('theme'); } catch (_) {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = storedTheme || (systemDark ? 'dark' : 'light');
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
  }));

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const menuBtn = $('[data-menu-toggle]');
  const menu = $('[data-mobile-menu]');
  menuBtn?.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  const backdrop = $('[data-command-backdrop]');
  const commandInput = $('[data-command-input]');
  const openCommand = () => { if (!backdrop) return; backdrop.hidden=false; requestAnimationFrame(()=>{ commandInput?.focus(); try { commandIndex = 0; paintCommandSelection(); } catch (_) {} }); };
  const closeCommand = () => { if (!backdrop) return; backdrop.hidden=true; if (!menu?.classList.contains('open')) document.body.style.overflow=''; };
  $$('[data-command-open]').forEach(b=>b.addEventListener('click', openCommand));
  backdrop?.addEventListener('click', e=>{ if(e.target===backdrop) closeCommand(); });
  document.addEventListener('keydown', e=>{
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); backdrop?.hidden ? openCommand() : closeCommand(); }
    if(e.key==='Escape'){ closeCommand(); closeTerminal(); }
  });
  let commandIndex = 0;
  const visibleCommands = () => $$('[data-command-item]').filter(item => !item.hidden);
  const paintCommandSelection = () => {
    const items = visibleCommands();
    if (!items.length) return;
    commandIndex = Math.max(0, Math.min(commandIndex, items.length - 1));
    $$('[data-command-item]').forEach(item => item.removeAttribute('data-selected'));
    items[commandIndex]?.setAttribute('data-selected', 'true');
    items[commandIndex]?.scrollIntoView({ block: 'nearest' });
  };
  commandInput?.addEventListener('input', () => {
    const q=commandInput.value.toLowerCase().trim();
    $$('[data-command-item]').forEach(item=>item.hidden = Boolean(q && !item.textContent.toLowerCase().includes(q)));
    commandIndex = 0; paintCommandSelection();
  });
  commandInput?.addEventListener('keydown', e => {
    const items = visibleCommands();
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); commandIndex = (commandIndex + 1) % items.length; paintCommandSelection(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); commandIndex = (commandIndex - 1 + items.length) % items.length; paintCommandSelection(); }
    if (e.key === 'Enter') { e.preventDefault(); items[commandIndex]?.click(); }
  });

  const terminal = $('[data-terminal]');
  const terminalOutput = $('[data-terminal-output]');
  const terminalForm = $('[data-terminal-form]');
  const terminalInput = $('[data-terminal-input]');
  function openTerminal(){ closeCommand(); if(!terminal) return; terminal.hidden=false; terminalInput?.focus(); }
  function closeTerminal(){ if(terminal) terminal.hidden=true; }
  $$('[data-terminal-open]').forEach(b=>b.addEventListener('click', openTerminal));
  $('[data-terminal-close]')?.addEventListener('click', closeTerminal);
  const commands={
    help:'Commands: about, projects, now, lab, videos, github, youtube, coffee, clear',
    about:'Amin builds practical AI and developer tools, tests them on real projects, and documents what survives.',
    projects:'Open /projects/ to see shipped work, active builds, experiments and archived projects.',
    now:'Currently focused on TL Studio, TlabRouter, and TunnelLab.',
    lab:'Benchmarks, experiments, prototypes and useful dead ends live in /lab/.',
    videos:'TunnelLab → https://www.youtube.com/@tunnellab',
    github:'GitHub → https://github.com/pouramin',
    youtube:'YouTube → https://www.youtube.com/@tunnellab',
    coffee:'Support → https://buymeacoffee.com/pouramin'
  };
  terminalForm?.addEventListener('submit', e=>{
    e.preventDefault(); const cmd=(terminalInput.value||'').trim().toLowerCase(); if(!cmd) return;
    const line=document.createElement('p'); line.textContent=`$ ${cmd}`; terminalOutput.appendChild(line);
    if(cmd==='clear'){ terminalOutput.innerHTML=''; }
    else {
      const resp=document.createElement('p');
      resp.textContent=commands[cmd] || `command not found: ${cmd}`;
      terminalOutput.appendChild(resp);
      const routes={projects:'/projects/',now:'/now/',lab:'/lab/',videos:'/videos/',github:'https://github.com/pouramin',youtube:'https://www.youtube.com/@tunnellab',coffee:'https://buymeacoffee.com/pouramin'};
      if(routes[cmd]){ const link=document.createElement('a'); link.href=routes[cmd]; link.textContent='open →'; if(routes[cmd].startsWith('http')){link.target='_blank';link.rel='noreferrer'} const p=document.createElement('p');p.appendChild(link);terminalOutput.appendChild(p); }
    }
    terminalInput.value=''; terminalOutput.scrollTop=terminalOutput.scrollHeight;
  });

  const filters=$$('[data-filter]');
  const projects=$$('[data-project-card]');
  filters.forEach(btn=>btn.addEventListener('click',()=>{
    filters.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const f=btn.dataset.filter;
    projects.forEach(card=>card.dataset.hidden=String(f!=='all' && card.dataset.status!==f));
  }));

  const reveal=$$('.reveal');
  if('IntersectionObserver' in window){ const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08});reveal.forEach(el=>obs.observe(el)); } else reveal.forEach(el=>el.classList.add('visible'));

  const activity = $('[data-github-activity]');
  if(activity){
    const fallback = () => activity.innerHTML = `
      <div class="activity-item"><i class="activity-dot"></i><div><strong>TL Studio is under active development</strong><small>Local AI development workspace</small></div><time>current</time></div>
      <div class="activity-item"><i class="activity-dot"></i><div><strong>TlabRouter private MVP</strong><small>Discovery + model routing</small></div><time>current</time></div>`;
    fetch('https://api.github.com/users/pouramin/events/public?per_page=6',{headers:{'Accept':'application/vnd.github+json'}})
      .then(r=>{if(!r.ok)throw new Error();return r.json()}).then(events=>{
        const seen=new Set(); const rows=[];
        for(const e of events){ const repo=e.repo?.name; if(!repo||seen.has(repo))continue; seen.add(repo); const kind=e.type?.replace('Event','')||'Activity'; const date=new Date(e.created_at); const rel=Math.max(0,Math.floor((Date.now()-date.getTime())/86400000)); rows.push(`<div class="activity-item"><i class="activity-dot"></i><div><strong>${repo.replace('pouramin/','')}</strong><small>${kind} on GitHub</small></div><time>${rel===0?'today':rel+'d ago'}</time></div>`); if(rows.length===4)break; }
        activity.innerHTML=rows.length?rows.join(''):''; if(!rows.length)fallback();
      }).catch(fallback);
  }
})();
