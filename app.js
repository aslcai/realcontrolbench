(() => {
  'use strict';
  const data = window.RCB;
  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const external = 'target="_blank" rel="noopener noreferrer"';
  const defaultSort = 'metric:instruction-following.success-rate:desc';
  const state = { model: data.models[0].id, kind: 'all', query: '', sort: defaultSort };
  let toastTimer;
  let activeDialog = null;
  $('#site-header').innerHTML = `<div class="header-inner"><nav id="site-nav" class="site-nav" aria-label="Main navigation"><a class="active" href="#about" aria-current="location">Home</a><a href="#leaderboard">Leaderboard</a><a href="#submit">Submit a Method</a><a href="${data.repository}#-getting-started" ${external}>Documentation</a><button data-dialog="resources">Paper &amp; Code</button></nav></div>`;
  $('#site-footer').innerHTML = `<span>RealControlBench · Development preview</span><div class="footer-links"><a href="${data.repository}" ${external}>Code</a><a href="${data.dataset}" ${external}>Dataset</a></div>`;
  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3800);
  }
  function openDialog(title, eyebrow, content) {
    if (activeDialog) activeDialog.close();
    const returnFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `<div class="dialog-header"><div><p class="eyebrow">${escapeHTML(eyebrow)}</p><h2 id="dialog-title">${escapeHTML(title)}</h2></div><button class="dialog-close" aria-label="Close dialog" autofocus>×</button></div><div class="dialog-content">${content}</div>`;
    $('#dialog-root').append(dialog);
    activeDialog = dialog;
    $('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      dialog.remove();
      if (activeDialog === dialog) activeDialog = null;
      if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    }, { once: true });
    document.body.classList.add('dialog-open');
    dialog.showModal();
    return dialog;
  }
  function showResources() {
    openDialog('Paper and code', 'PAPER & CODE', `<p>Evaluation code, data, and task documentation for RealControlBench.</p><div class="resource-list"><a class="resource-item" href="${data.repository}" ${external}>Code repository <span>GitHub</span></a><a class="resource-item" href="${data.dataset}" ${external}>Benchmark dataset <span>Hugging Face</span></a><a class="resource-item" href="${data.repository}#-getting-started" ${external}>Evaluation documentation <span>Getting started</span></a><div class="resource-item">Research paper <span>Link forthcoming</span></div></div>`);
  }
  function model() { return data.models.find((item) => item.id === state.model); }
  const metricGroups = data.tasks.flatMap((task) => {
    const group = { task, track: '', label: task.label, metrics: task.metrics, notes: task.metricNotes };
    if (task.id !== 'tool-use') return [group];
    return [
      { ...group, track: 'single', label: 'Single-turn & follow-up' },
      {
        task, track: 'multi', label: 'Multi-turn execution',
        metrics: ['Combined accuracy ↑', 'BFCL accuracy ↑', 'Decision accuracy ↑'],
        notes: [
          'Combined execution checks and the required clarification or abstention behavior.',
          'BFCL execution and no-call checks.',
          'Semantic decision accuracy for conversations with a required judgment.'
        ]
      }
    ];
  });
  const metricColumns = metricGroups.flatMap((group) => group.metrics.map((label, index) => ({
    id: [group.task.id, group.track, label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')].filter(Boolean).join('.'),
    label: label.replace(/\s*↑$/, ''), note: group.notes[index], first: index === 0
  })));
  function metricSort(value = state.sort) {
    const [type, id, direction] = value.split(':');
    const column = metricColumns.find((item) => item.id === id);
    return type === 'metric' && column && ['asc', 'desc'].includes(direction) ? { column, direction } : null;
  }
  function score(method, column) {
    const value = data.results?.[state.model]?.[method.id]?.[column.id];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  function methodName(method) { return method.id === 'prompted' ? 'Prompted / CoT' : method.name; }
  function taskLinks() {
    return data.tasks.map((task) => '<a class="resource-item" href="' + data.repository + '/tree/main/' + task.docs + '" ' + external + '>' + escapeHTML(task.label) + ' <span>Task code</span></a>').join('');
  }
  function showMethod(id) {
    const method = data.methods.find((item) => item.id === id);
    if (!method) return;
    openDialog(methodName(method), 'METHOD PROFILE / PREVIEW',
      '<div class="dialog-meta"><span class="tag">' + (method.kind === 'baseline' ? 'Reference baseline' : 'Steering method') + '</span><span class="tag">' + escapeHTML(model().name) + '</span><span class="tag">All tasks</span></div>' +
      '<p>' + escapeHTML(method.description) + '</p><div class="resource-list">' + taskLinks() + '</div>');
  }
  function tableHead() {
    const groups = data.tasks.map((task) => {
      const count = metricGroups.filter((group) => group.task.id === task.id).reduce((sum, group) => sum + group.metrics.length, 0);
      return '<th scope="colgroup" class="task-group" colspan="' + count + '"><span class="group-title">' + escapeHTML(task.id === 'tool-use' ? 'Tool use' : task.short) + '</span></th>';
    }).join('');
    const sort = metricSort();
    const metrics = metricColumns.map((column) => {
      const active = sort?.column.id === column.id;
      const direction = active ? sort.direction : null;
      const next = direction === 'desc' ? 'ascending' : 'descending';
      return '<th scope="col" class="metric-heading ' + (column.first ? 'group-start' : '') + '"' + (active ? ' aria-sort="' + (direction === 'desc' ? 'descending' : 'ascending') + '"' : '') + '><button class="metric-sort" data-sort-metric="' + column.id + '" title="' + escapeHTML(column.note) + ' Higher is better. Click to sort ' + next + '." aria-label="' + escapeHTML(column.label) + ': sort ' + next + '">' + escapeHTML(column.label) + '<span aria-hidden="true">' + (direction === 'desc' ? '↓' : '↑') + '</span></button></th>';
    }).join('');
    return '<tr><th scope="col" class="rank-column" rowspan="2">Rank</th><th scope="col" class="method-column" rowspan="2">Method</th>' + groups + '<th scope="col" class="utility-heading" rowspan="2">Results</th><th scope="col" class="utility-heading" rowspan="2">Resources</th></tr><tr>' + metrics + '</tr>';
  }
  document.addEventListener('click', (event) => {
    const dialogButton = event.target.closest('[data-dialog]');
    if (dialogButton) ({ resources: showResources })[dialogButton.dataset.dialog]?.();
    const methodButton = event.target.closest('[data-method]');
    if (methodButton) showMethod(methodButton.dataset.method);
  });
  function readHash() {
    const params = new URLSearchParams(location.search || (location.hash.includes('=') ? location.hash.slice(1) : ''));
    state.model = data.models.some((item) => item.id === params.get('model')) ? params.get('model') : data.models[0].id;
    // Legacy task/track links now open the same all-task table.
    state.kind = ['all', 'steering', 'baseline'].includes(params.get('kind')) ? params.get('kind') : 'all';
    state.query = (params.get('q') || '').slice(0, 150);
    const sort = params.get('sort') || defaultSort;
    state.sort = ['reference', 'az', 'za'].includes(sort) || metricSort(sort) ? sort : defaultSort;
  }
  function syncURL() {
    const params = new URLSearchParams({ model: state.model });
    if (state.kind !== 'all') params.set('kind', state.kind);
    if (state.query) params.set('q', state.query);
    if (state.sort !== defaultSort) params.set('sort', state.sort);
    try { history.replaceState(null, '', `?${params}${['#about', '#leaderboard', '#submit'].includes(location.hash) ? location.hash : ''}`); } catch { /* File previews may restrict history. Filters still work. */ }
  }
  function modelMethods() { return data.methods.filter((method) => !method.models || method.models.includes(state.model)); }
  function filteredMethods() {
    const sort = metricSort();
    return modelMethods().filter((method) =>
      (state.kind === 'all' || state.kind === method.kind) &&
      `${methodName(method)} ${method.name}`.toLowerCase().includes(state.query.trim().toLowerCase())
    ).sort((a, b) => {
      if (sort) {
        const av = score(a, sort.column), bv = score(b, sort.column);
        if (av === null && bv !== null) return 1;
        if (bv === null && av !== null) return -1;
        if (av !== null && bv !== null && av !== bv) return (av - bv) * (sort.direction === 'asc' ? 1 : -1);
      }
      if (state.sort === 'reference' && a.kind !== b.kind) return a.kind === 'baseline' ? -1 : 1;
      if (state.sort === 'reference' && a.kind === 'baseline') return a.id === 'unsteered' ? -1 : 1;
      return methodName(a).localeCompare(methodName(b), 'en') * (state.sort === 'za' ? -1 : 1);
    });
  }
  function ranks() {
    const sort = metricSort();
    if (!sort) return new Map();
    const scored = modelMethods().map((method) => ({ id: method.id, value: score(method, sort.column) }))
      .filter((item) => item.value !== null).sort((a, b) => b.value - a.value);
    let rank = 0;
    return new Map(scored.map((item, index) => {
      if (!index || item.value !== scored[index - 1].value) rank = index + 1;
      return [item.id, rank];
    }));
  }
  function methodCell(method) {
    return '<button class="method-link" data-method="' + method.id + '">' + escapeHTML(methodName(method)) + '</button>';
  }
  function render() {
    const methods = filteredMethods();
    const rankById = ranks();
    const sort = metricSort();
    $('#model-filter').value = state.model;
    $('#metric-sort-option').value = sort ? state.sort : defaultSort;
    $('#metric-sort-option').textContent = sort ? sort.column.label + (sort.direction === 'desc' ? ' ↓' : ' ↑') : 'Success rate ↓';
    $('#sort-filter').value = state.sort;
    $('#method-search').value = state.query;
    document.querySelectorAll('[data-kind]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind)));
    $('#results-head').innerHTML = tableHead();
    $('#results-body').innerHTML = methods.map((method) =>
      '<tr data-method-row="' + method.id + '"><td class="rank-column">' + (rankById.get(method.id) || '<span aria-label="Not ranked">—</span>') + '</td><th scope="row" class="method-column">' + methodCell(method) + '</th>' +
      metricColumns.map((column) => '<td class="metric-value ' + (column.first ? 'group-start' : '') + '">' + (score(method, column) === null ? '<span class="missing-score" aria-label="Not published">—</span>' : escapeHTML(score(method, column))) + '</td>').join('') +
      '<td class="group-start"><span class="status-label">' + (metricColumns.some((column) => score(method, column) !== null) ? 'Available' : 'Not published') + '</span></td><td><button class="text-button" data-method="' + method.id + '" aria-label="Resources for ' + escapeHTML(methodName(method)) + '">Details</button></td></tr>'
    ).join('');
    $('#empty-state').hidden = methods.length !== 0;
    $('#metric-notes').innerHTML = metricGroups.map((group) =>
      '<section class="metric-note-group"><h3>' + escapeHTML(group.task.label + (group.track ? ' / ' + group.label : '')) + '</h3>' +
      group.metrics.map((metric, index) => '<p><strong>' + escapeHTML(metric) + '.</strong> ' + escapeHTML(group.notes[index]) + '</p>').join('') + '</section>'
    ).join('');
    syncURL();
  }
  $('#model-filter').innerHTML = data.models.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  readHash();
  render();
  function updateNavigation() {
    const anchor = ['#leaderboard', '#submit'].includes(location.hash) ? location.hash : '#about';
    document.querySelectorAll('#site-nav a[href^="#"]').forEach((link) => {
      const active = link.getAttribute('href') === anchor;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  updateNavigation();
  window.addEventListener('hashchange', () => {
    updateNavigation();
    if (['#about', '#leaderboard', '#submit', ''].includes(location.hash)) return;
    readHash(); render();
  });
  [['#model-filter', 'model'], ['#sort-filter', 'sort']].forEach(([selector, key]) => {
    $(selector).addEventListener('change', (event) => { state[key] = event.target.value; render(); });
  });
  $('#method-search').addEventListener('input', (event) => { state.query = event.target.value.slice(0, 150); render(); });
  document.querySelectorAll('[data-kind]').forEach((button) => button.addEventListener('click', () => { state.kind = button.dataset.kind; render(); }));
  $('#clear-filters').addEventListener('click', () => { state.query = ''; state.kind = 'all'; render(); $('#method-search').focus(); });
  $('#results-head').addEventListener('click', (event) => {
    const button = event.target.closest('[data-sort-metric]');
    if (!button) return;
    const sort = metricSort();
    const id = button.dataset.sortMetric;
    const direction = sort?.column.id === id && sort.direction === 'desc' ? 'asc' : 'desc';
    state.sort = 'metric:' + id + ':' + direction;
    render();
    $('#results-head').querySelector('[data-sort-metric="' + id + '"]').focus({ preventScroll: true });
    $('#sort-status').textContent = button.textContent.trim().replace(/[↑↓]/g, '') + ' sorted ' + (direction === 'desc' ? 'highest first.' : 'lowest first.');
  });
  $('#share-view').addEventListener('click', async () => {
    const link = location.href;
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(link); toast('Current view link copied.'); }
    catch {
      const dialog = openDialog('Share this view.', 'CURRENT FILTERS', `<p>Copy this link to reopen the same model and filters, with all tasks displayed.${location.protocol === 'file:' ? ' This local file link works only on a device with the website files.' : ''}</p><label><span class="sr-only">Current view URL</span><input class="share-input" readonly value="${escapeHTML(link)}"></label>`);
      dialog.querySelector('input').select();
    }
  });
  $('#submission-model').innerHTML = data.models.map((item) => `<option value="${item.name}">${item.name}</option>`).join('') + '<option value="Other">Other</option>';
  $('#submission-form').addEventListener('submit', (event) => {
    const name = $('#submission-name').value.trim();
    if (!name) {
      event.preventDefault();
      $('#submission-name').setCustomValidity('Enter a method name.');
      $('#submission-name').reportValidity();
      return;
    }
    $('#submission-title').value = 'Method submission: ' + name;
    $('#submission-body').value = [
      '## Method', name,
      '## Paper', $('#submission-paper').value.trim() || 'Not provided',
      '## Code', $('#submission-code').value.trim(),
      '## Base model', $('#submission-model').value,
      '## Evaluation results', $('#submission-results').value.trim() || 'Not provided',
      '## Evaluation settings and notes', $('#submission-notes').value.trim() || 'Not provided'
    ].join('\n\n');
  });
  $('#submission-name').addEventListener('input', () => $('#submission-name').setCustomValidity(''));
})();
