(() => {
  const root = document.documentElement;
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const themeMeta = $('meta[name="theme-color"]');

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  $$('[data-command-open]').forEach(btn => {
    btn.innerHTML = isMac ? '<span>⌘</span>K' : '<span>Ctrl</span>K';
    btn.setAttribute('aria-label', `Open command palette (${isMac ? 'Command' : 'Control'} K)`);
  });

  let storedTheme = null;
  try { storedTheme = localStorage.getItem('theme'); } catch (_) {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const applyTheme = theme => {
    root.dataset.theme = theme;
    themeMeta?.setAttribute('content', theme === 'dark' ? '#111315' : '#f7f7f4');
    $$('[data-theme-toggle]').forEach(btn => btn.setAttribute('aria-pressed', String(theme === 'dark')));
  };
  applyTheme(storedTheme || (systemDark ? 'dark' : 'light'));
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (_) {}
  }));

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const normalizePath = path => {
    if (!path) return '/';
    const clean = path.replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
    return clean !== '/' && clean.endsWith('/') ? clean : clean;
  };
  const currentPath = normalizePath(window.location.pathname);
  $$('.desktop-nav a, [data-mobile-menu] a, .footer-col a').forEach(link => {
    if (!link.href || link.origin !== window.location.origin) return;
    const target = normalizePath(new URL(link.href).pathname);
    if (target === currentPath) link.setAttribute('aria-current', 'page');
  });

  const menuBtn = $('[data-menu-toggle]');
  const menu = $('[data-mobile-menu]');
  if (menu && menuBtn) {
    if (!menu.id) menu.id = 'mobile-menu';
    menuBtn.setAttribute('aria-controls', menu.id);
  }
  const closeMenu = () => {
    if (!menu || !menuBtn) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  menuBtn?.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('[data-mobile-menu] a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });

  const backdrop = $('[data-command-backdrop]');
  const commandInput = $('[data-command-input]');
  const commandList = $('[data-command-list]');
  let commandIndex = 0;
  let lastCommandTrigger = null;

  const commandItems = () => $$('[data-command-item]');
  const visibleCommands = () => commandItems().filter(item => !item.hidden);

  const commandKeyFor = item => {
    if (item.matches('[data-terminal-open]')) return 't';
    const href = item.getAttribute('href') || '';
    if (href === '/projects/') return 'p';
    if (href === '/builds/') return 'd';
    if (href === '/now/') return 'n';
    if (href === '/lab/') return 'l';
    if (href === '/videos/') return 'v';
    if (href === '/build-log/') return 'b';
    if (href.includes('github.com/pouramin')) return 'g';
    if (href.includes('buymeacoffee.com/pouramin')) return 's';
    return '';
  };

  const hotkeyLabel = key => {
    if (!key) return '';
    return `${isMac ? '⌥' : 'Alt+'}${key.toUpperCase()}`;
  };

  commandItems().forEach(item => {
    const key = commandKeyFor(item);
    if (key) item.dataset.commandKey = key;
    const badge = $('kbd', item);
    if (badge && key) badge.textContent = hotkeyLabel(key);
  });

  const commandEmpty = document.createElement('div');
  commandEmpty.className = 'command-empty';
  commandEmpty.textContent = 'No matching commands.';
  commandEmpty.hidden = true;
  commandList?.appendChild(commandEmpty);

  const paintCommandSelection = () => {
    const items = visibleCommands();
    commandItems().forEach(item => item.removeAttribute('data-selected'));

    if (!items.length) {
      commandEmpty.hidden = false;
      return;
    }

    commandEmpty.hidden = true;
    commandIndex = Math.max(0, Math.min(commandIndex, items.length - 1));
    const selected = items[commandIndex];
    selected?.setAttribute('data-selected', 'true');
    selected?.scrollIntoView({ block: 'nearest' });
  };

  const resetCommandSearch = () => {
    if (commandInput) commandInput.value = '';
    commandItems().forEach(item => item.hidden = false);
    commandIndex = 0;
    commandEmpty.hidden = true;
  };

  const openCommand = trigger => {
    if (!backdrop) return;
    if (trigger) lastCommandTrigger = trigger;
    if (menu?.classList.contains('open')) closeMenu();
    resetCommandSearch();
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      commandInput?.focus();
      paintCommandSelection();
    });
  };

  const closeCommand = ({ restoreFocus = true } = {}) => {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    resetCommandSearch();
    if (!menu?.classList.contains('open')) document.body.style.overflow = '';
    if (restoreFocus) lastCommandTrigger?.focus();
  };

  const activateCommand = item => {
    if (!item) return;
    if (item.matches('[data-terminal-open]')) {
      item.click();
      return;
    }

    const href = item.getAttribute('href');
    if (!href) return;

    const target = item.getAttribute('target');
    closeCommand({ restoreFocus: false });
    if (target === '_blank') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(href);
    }
  };

  $$('[data-command-open]').forEach(button => {
    button.addEventListener('click', () => openCommand(button));
  });

  commandItems().forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      const items = visibleCommands();
      const visibleIndex = items.indexOf(item);
      if (visibleIndex >= 0) {
        commandIndex = visibleIndex;
        paintCommandSelection();
      }
    });

    item.addEventListener('focus', () => {
      const items = visibleCommands();
      const visibleIndex = items.indexOf(item);
      if (visibleIndex >= 0) commandIndex = visibleIndex;
    });

    item.addEventListener('click', event => {
      if (item.matches('[data-terminal-open]')) return;
      if (event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activateCommand(item);
    });
  });

  backdrop?.addEventListener('mousedown', event => {
    if (event.target === backdrop) closeCommand();
  });

  commandInput?.addEventListener('input', () => {
    const query = commandInput.value.toLocaleLowerCase().trim();
    commandItems().forEach(item => {
      item.hidden = Boolean(query && !item.textContent.toLocaleLowerCase().includes(query));
    });
    commandIndex = 0;
    paintCommandSelection();
  });

  commandInput?.addEventListener('keydown', event => {
    const items = visibleCommands();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!items.length) return;
      commandIndex = (commandIndex + 1) % items.length;
      paintCommandSelection();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!items.length) return;
      commandIndex = (commandIndex - 1 + items.length) % items.length;
      paintCommandSelection();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      activateCommand(items[commandIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommand();
      return;
    }

    if (event.altKey && /^[a-z]$/i.test(event.key)) {
      const item = commandItems().find(candidate => candidate.dataset.commandKey === event.key.toLowerCase() && !candidate.hidden);
      if (item) {
        event.preventDefault();
        activateCommand(item);
      }
    }
  });

  backdrop?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [commandInput, ...visibleCommands()].filter(Boolean);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const terminal = $('[data-terminal]');
  const terminalOutput = $('[data-terminal-output]');
  const terminalForm = $('[data-terminal-form]');
  const terminalInput = $('[data-terminal-input]');
  function openTerminal(){ closeCommand(); if(!terminal) return; terminal.hidden=false; terminalInput?.focus(); }
  function closeTerminal(){ if(terminal) terminal.hidden=true; }
  $$('[data-terminal-open]').forEach(b=>b.addEventListener('click', openTerminal));
  $('[data-terminal-close]')?.addEventListener('click', closeTerminal);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      backdrop?.hidden ? openCommand(document.activeElement) : closeCommand();
      return;
    }

    if (e.key === 'Escape') {
      closeCommand();
      closeTerminal();
      return;
    }

    if (!backdrop?.hidden && e.altKey && /^[a-z]$/i.test(e.key) && document.activeElement !== commandInput) {
      const item = commandItems().find(candidate => candidate.dataset.commandKey === e.key.toLowerCase() && !candidate.hidden);
      if (item) {
        e.preventDefault();
        activateCommand(item);
      }
    }
  });

  const commands = {
    help:'Commands: about, projects, builds, now, lab, videos, uses, github, youtube, coffee, clear',
    about:'Amin builds practical AI and developer tools, tests them on real projects, and documents what survives.',
    projects:'Open /projects/ to see shipped work, active builds, experiments and archived projects.',
    builds:'Small tools, prototypes and one-purpose utilities live in /builds/.',
    now:'Currently focused on TL Studio, TlabRouter, and TunnelLab.',
    lab:'Benchmarks, experiments, prototypes and useful dead ends live in /lab/.',
    videos:'TunnelLab → https://www.youtube.com/@tunnellab',
    uses:'The current hardware, software and services are listed in /uses/.',
    github:'GitHub → https://github.com/pouramin',
    youtube:'YouTube → https://www.youtube.com/@tunnellab',
    coffee:'Support → https://buymeacoffee.com/pouramin'
  };
  terminalForm?.addEventListener('submit', e => {
    e.preventDefault();
    const cmd = (terminalInput.value || '').trim().toLowerCase();
    if (!cmd) return;
    const line = document.createElement('p');
    line.textContent = `$ ${cmd}`;
    terminalOutput.appendChild(line);
    if (cmd === 'clear') {
      terminalOutput.innerHTML = '';
    } else {
      const resp = document.createElement('p');
      resp.textContent = commands[cmd] || `command not found: ${cmd}`;
      terminalOutput.appendChild(resp);
      const routes = {
        projects:'/projects/', builds:'/builds/', now:'/now/', lab:'/lab/', videos:'/videos/', uses:'/uses/',
        github:'https://github.com/pouramin', youtube:'https://www.youtube.com/@tunnellab', coffee:'https://buymeacoffee.com/pouramin'
      };
      if (routes[cmd]) {
        const link = document.createElement('a');
        link.href = routes[cmd];
        link.textContent = 'open →';
        if (routes[cmd].startsWith('http')) { link.target='_blank'; link.rel='noreferrer'; }
        const p = document.createElement('p');
        p.appendChild(link);
        terminalOutput.appendChild(p);
      }
    }
    terminalInput.value = '';
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });

  const filters = $$('[data-filter]');
  const projects = $$('[data-project-card]');
  const filterEmpty = $('[data-filter-empty]');
  const applyProjectFilter = f => {
    let visible = 0;
    projects.forEach(card => {
      const hidden = f !== 'all' && card.dataset.status !== f;
      card.dataset.hidden = String(hidden);
      if (!hidden) visible++;
    });
    if (filterEmpty) {
      filterEmpty.hidden = visible !== 0;
      filterEmpty.textContent = f === 'archived'
        ? 'No archived projects on this shelf yet.'
        : 'Nothing in this category yet.';
    }
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
  };
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyProjectFilter(btn.dataset.filter);
  }));
  if (filters.length) applyProjectFilter('all');

  const reveal = $('.reveal');
  if ('IntersectionObserver' in window) {
    reveal.forEach(el => el.classList.add('reveal-pending'));
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.remove('reveal-pending');
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    }), { threshold:.08 });
    reveal.forEach(el => obs.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('visible'));
  }

  const activity = $('[data-github-activity]');
  if (activity) {
    const fallback = () => activity.innerHTML = `
      <a class="activity-item activity-link" href="https://github.com/pouramin/TL-Studio" target="_blank" rel="noreferrer"><i class="activity-dot"></i><div><strong>TL Studio is under active development</strong><small>Local AI development workspace</small></div><time>current</time></a>
      <a class="activity-item activity-link" href="/projects/tlabrouter.html"><i class="activity-dot"></i><div><strong>TlabRouter private MVP</strong><small>Discovery + model routing</small></div><time>current</time></a>`;
    fetch('https://api.github.com/users/pouramin/events/public?per_page=6',{headers:{'Accept':'application/vnd.github+json'}})
      .then(r => { if(!r.ok) throw new Error(); return r.json(); })
      .then(events => {
        const seen = new Set();
        const rows = [];
        for (const e of events) {
          const repo = e.repo?.name;
          if (!repo || seen.has(repo)) continue;
          seen.add(repo);
          const kind = e.type?.replace('Event','') || 'Activity';
          const date = new Date(e.created_at);
          const rel = Math.max(0, Math.floor((Date.now()-date.getTime())/86400000));
          rows.push(`<a class="activity-item activity-link" href="https://github.com/${repo}" target="_blank" rel="noreferrer"><i class="activity-dot"></i><div><strong>${repo.replace('pouramin/','')}</strong><small>${kind} on GitHub</small></div><time>${rel===0?'today':rel+'d ago'}</time></a>`);
          if (rows.length === 4) break;
        }
        activity.innerHTML = rows.length ? rows.join('') : '';
        if (!rows.length) fallback();
      })
      .catch(fallback);
  }

  const videoGrid = $('[data-video-grid]');
  const latestVideoFeature = $('[data-latest-video-feature]');
  const latestVideoTitle = $('[data-latest-video-title]');
  const latestVideoMeta = $('[data-latest-video-meta]');
  const videoStatus = $('[data-video-status]');

  const formatVideoDate = value => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(date)
      .toUpperCase();
  };

  const renderVideoCard = video => {
    const link = document.createElement('a');
    link.className = 'latest-video-card';
    link.href = video.url || `https://www.youtube.com/watch?v=${video.videoId}`;
    link.target = '_blank';
    link.rel = 'noreferrer';

    const thumb = document.createElement('div');
    thumb.className = 'latest-video-thumb';
    const img = document.createElement('img');
    img.src = video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;
    img.alt = `${video.title || 'TunnelLab video'} thumbnail`;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      const fallback = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
      if (img.src !== fallback) img.src = fallback;
    }, { once: true });
    thumb.appendChild(img);

    const body = document.createElement('div');
    body.className = 'latest-video-body';
    const date = document.createElement('span');
    date.className = 'micro';
    date.textContent = formatVideoDate(video.publishedAt);
    const title = document.createElement('h3');
    title.dir = 'auto';
    title.textContent = video.title || 'TunnelLab video';
    const meta = document.createElement('div');
    meta.className = 'latest-video-meta';
    const source = document.createElement('span');
    source.textContent = 'TunnelLab';
    const watch = document.createElement('span');
    watch.textContent = 'Watch ↗';
    meta.append(source, watch);
    body.append(date, title, meta);
    link.append(thumb, body);
    return link;
  };

  if (videoGrid || latestVideoFeature) {
    fetch('/data/videos.json', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('video feed unavailable'); return r.json(); })
      .then(data => {
        const videos = Array.isArray(data.videos) ? data.videos : [];
        if (!videos.length) throw new Error('empty video feed');

        if (videoGrid) {
          videoGrid.replaceChildren(...videos.slice(0, 6).map(renderVideoCard));
          if (videoStatus) {
            const feedDate = formatVideoDate(data.feedUpdatedAt);
            videoStatus.textContent = feedDate
              ? `Automatically refreshed from YouTube · feed updated ${feedDate}`
              : 'Automatically refreshed from the public YouTube feed.';
          }
        }

        const latest = videos[0];
        if (latestVideoFeature && latest) {
          latestVideoFeature.href = latest.url || `https://www.youtube.com/watch?v=${latest.videoId}`;
          if (latestVideoTitle) { latestVideoTitle.dir = 'auto'; latestVideoTitle.textContent = latest.title || 'Latest TunnelLab video'; }
          if (latestVideoMeta) {
            const date = formatVideoDate(latest.publishedAt);
            latestVideoMeta.textContent = date ? `Latest upload · ${date}` : 'Latest upload on TunnelLab';
          }
        }
      })
      .catch(() => {
        if (videoStatus) videoStatus.textContent = 'Showing the latest cached TunnelLab videos.';
      });
  }

})();
