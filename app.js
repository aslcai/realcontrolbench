(() => {
  'use strict';
  const data = window.RCB;
  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const external = 'target="_blank" rel="noopener noreferrer"';
  const isBoard = document.body.dataset.page === 'leaderboard';
  const state = { model: data.models[0].id, task: data.tasks[0].id, track: 'single', kind: 'all', query: '', sort: 'reference' };
  const selected = new Set();
  let toastTimer;
  let activeDialog = null;

  $('#site-header').innerHTML = `<div class="header-inner"><nav id="site-nav" class="site-nav" aria-label="Main navigation"><a class="active" href="#about" aria-current="location">Home</a><a href="#leaderboard">Leaderboard</a><button data-dialog="submit">Submit a Method</button><a href="${data.repository}#-getting-started" ${external}>Documentation</a><button data-dialog="resources">Paper &amp; Code</button></nav></div>`;
  $('#site-footer').innerHTML = `<span>RealControlBench · Development preview</span><div class="footer-links"><a href="${data.repository}" ${external}>Code</a><a href="${data.dataset}" ${external}>Dataset</a></div>`;

  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3800);
  }

  function openDialog(title, eyebrow, content, wide = false) {
    if (activeDialog) activeDialog.close();
    const returnFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = wide ? 'dialog-compare' : '';
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

  function showSubmit() {
    openDialog('Submit a method', 'SUBMIT TO REALCONTROLBENCH', `<p>Share your steering method, its evaluation settings, and the evidence behind its results.</p><div class="submission-options"><div class="submission-option"><span>01 / RESULTS</span><h3>Upload evaluation results</h3><p>Run the benchmark and provide its generated result files alongside your method information.</p></div><div class="submission-option"><span>02 / METHOD ARTIFACTS</span><h3>Provide your method</h3><p>Share the code or artifacts and configuration needed for the benchmark team to evaluate it.</p></div></div><div class="dialog-message"><strong>Submissions are not open yet.</strong><p>This is a preview of the submission options. No files are uploaded and no evaluation is queued.</p></div><a class="button primary" href="${data.repository}" ${external}>Read the evaluation guide</a>`);
  }

  function showResources() {
    openDialog('Paper and code', 'PAPER & CODE', `<p>Evaluation code, data, and task documentation for RealControlBench.</p><div class="resource-list"><a class="resource-item" href="${data.repository}" ${external}>Code repository <span>GitHub</span></a><a class="resource-item" href="${data.dataset}" ${external}>Benchmark dataset <span>Hugging Face</span></a><a class="resource-item" href="${data.repository}#-getting-started" ${external}>Evaluation documentation <span>Getting started</span></a><div class="resource-item">Research paper <span>Link forthcoming</span></div></div>`);
  }

  function model() { return data.models.find((item) => item.id === state.model); }
  function task() { return data.tasks.find((item) => item.id === state.task); }
  function methodName(method) { return method.id === 'prompted' && state.task === 'reasoning' ? 'CoT baseline' : method.name; }
  function metricInfo() {
    if (state.task === 'tool-use' && state.track === 'multi') return {
      metrics: ['Combined accuracy ↑', 'BFCL accuracy ↑', 'Decision accuracy ↑'],
      notes: ['Combined execution checks and the required clarification or abstention behavior.', 'BFCL execution and no-call checks.', 'Semantic decision accuracy for conversations with a required judgment.']
    };
    return { metrics: task().metrics, notes: task().metricNotes };
  }

  function showMethod(id) {
    const method = data.methods.find((item) => item.id === id);
    if (!method) return;
    const name = isBoard ? methodName(method) : method.name;
    openDialog(name, 'METHOD PROFILE / PREVIEW', `<div class="dialog-meta"><span class="tag">${method.kind === 'baseline' ? 'Reference baseline' : 'Steering method'}</span><span class="tag">${escapeHTML(model().name)}</span><span class="tag">${escapeHTML(task().label)}</span></div><p>${escapeHTML(method.description)}</p><div class="dialog-message"><strong>Results not published in this preview.</strong><p>Authors, artifacts, intervention configuration, and per-task scores will be linked to an evaluated submission. No layer, strength, or score is implied by this catalogue entry.</p></div><a class="button secondary" href="${data.repository}/tree/main/${task().docs}" ${external}>View task implementation</a>`);
  }

  document.addEventListener('click', (event) => {
    const dialogButton = event.target.closest('[data-dialog]');
    if (dialogButton) ({ submit: showSubmit, resources: showResources })[dialogButton.dataset.dialog]?.();
    const methodButton = event.target.closest('[data-method]');
    if (methodButton) showMethod(methodButton.dataset.method);
  });

  function readHash() {
    const params = new URLSearchParams(location.search || (location.hash.includes('=') ? location.hash.slice(1) : ''));
    state.model = data.models.some((item) => item.id === params.get('model')) ? params.get('model') : data.models[0].id;
    state.task = data.tasks.some((item) => item.id === params.get('task')) ? params.get('task') : data.tasks[0].id;
    state.track = params.get('track') === 'multi' ? 'multi' : 'single';
    state.kind = ['all', 'steering', 'baseline'].includes(params.get('kind')) ? params.get('kind') : 'all';
    state.query = (params.get('q') || '').slice(0, 150);
    state.sort = ['reference', 'az', 'za'].includes(params.get('sort')) ? params.get('sort') : 'reference';
  }

  function syncURL() {
    const params = new URLSearchParams({ model: state.model, task: state.task });
    if (state.task === 'tool-use') params.set('track', state.track);
    if (state.kind !== 'all') params.set('kind', state.kind);
    if (state.query) params.set('q', state.query);
    if (state.sort !== 'reference') params.set('sort', state.sort);
    try { history.replaceState(null, '', `?${params}${['#about', '#leaderboard'].includes(location.hash) ? location.hash : ''}`); } catch { /* File previews may restrict history. Filters still work. */ }
  }

  function filteredMethods() {
    return data.methods.filter((method) => (!method.models || method.models.includes(state.model)) &&
      (state.kind === 'all' || state.kind === method.kind) &&
      `${methodName(method)} ${method.name}`.toLowerCase().includes(state.query.trim().toLowerCase())
    ).sort((a, b) => {
      if (state.sort === 'reference' && a.kind !== b.kind) return a.kind === 'baseline' ? -1 : 1;
      if (state.sort === 'reference' && a.kind === 'baseline') return a.id === 'unsteered' ? -1 : 1;
      return methodName(a).localeCompare(methodName(b), 'en') * (state.sort === 'za' ? -1 : 1);
    });
  }

  function updateSelection() {
    $('#comparison-bar').hidden = selected.size === 0;
    $('#selected-count').textContent = selected.size;
    $('#compare-methods').disabled = selected.size < 2;
  }

  function render() {
    const currentTask = task();
    const info = metricInfo();
    const methods = filteredMethods();
    const visible = new Set(methods.map((method) => method.id));
    for (const id of selected) if (!visible.has(id)) selected.delete(id);
    $('#model-filter').value = state.model;
    $('#task-filter').value = state.task;
    $('#track-filter').value = state.track;
    $('#sort-filter').value = state.sort;
    $('#method-search').value = state.query;
    $('#track-field').hidden = state.task !== 'tool-use';
    document.querySelectorAll('[data-kind]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind)));
    $('#result-count').textContent = `${methods.length} ${methods.length === 1 ? 'method' : 'methods'} · ${model().name}`;
    $('#results-head').innerHTML = `<tr><th scope="col" class="select-column"><span class="sr-only">Select for comparison</span></th><th scope="col" class="method-column">Method</th>${info.metrics.map((metric, index) => `<th scope="col" title="${escapeHTML(info.notes[index])}">${escapeHTML(metric)}</th>`).join('')}<th scope="col">Results</th><th scope="col">Resources</th></tr>`;
    $('#results-body').innerHTML = methods.map((method) => `<tr class="${method.kind === 'baseline' ? 'baseline-row' : ''}"><td class="select-column"><input type="checkbox" data-select="${method.id}" aria-label="Compare ${escapeHTML(methodName(method))}" ${selected.has(method.id) ? 'checked' : ''}></td><td class="method-column"><button class="method-link" data-method="${method.id}">${escapeHTML(methodName(method))} <span aria-hidden="true">↗</span></button><span class="method-kind">${method.kind === 'baseline' ? 'baseline' : ''}</span></td>${info.metrics.map(() => '<td class="metric-value"><span aria-label="Not published">—</span></td>').join('')}<td><span class="status-label">Not published</span></td><td><a href="${data.repository}/tree/main/${currentTask.docs}" ${external} aria-label="Task code for ${escapeHTML(methodName(method))}">Code</a></td></tr>`).join('');
    $('#empty-state').hidden = methods.length !== 0;
    $('#metric-notes').innerHTML = info.metrics.map((metric, index) => `<p><strong>${escapeHTML(metric)}.</strong> ${escapeHTML(info.notes[index])}</p>`).join('');
    updateSelection();
    syncURL();
  }

  $('#model-filter').innerHTML = data.models.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  $('#task-filter').innerHTML = data.tasks.map((item) => `<option value="${item.id}">${item.label}</option>`).join('');
  readHash();
  render();
  function updateNavigation() {
    const anchor = location.hash === '#leaderboard' ? '#leaderboard' : '#about';
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
    if (['#about', '#leaderboard', ''].includes(location.hash)) return;
    selected.clear(); readHash(); render();
  });
  [['#model-filter', 'model'], ['#task-filter', 'task'], ['#track-filter', 'track'], ['#sort-filter', 'sort']].forEach(([selector, key]) => {
    $(selector).addEventListener('change', (event) => { state[key] = event.target.value; if (key !== 'sort') selected.clear(); render(); });
  });
  $('#method-search').addEventListener('input', (event) => { state.query = event.target.value.slice(0, 150); render(); });
  document.querySelectorAll('[data-kind]').forEach((button) => button.addEventListener('click', () => { state.kind = button.dataset.kind; render(); }));
  $('#clear-filters').addEventListener('click', () => { state.query = ''; state.kind = 'all'; render(); $('#method-search').focus(); });
  $('#results-body').addEventListener('change', (event) => {
    const input = event.target.closest('[data-select]');
    if (!input) return;
    if (input.checked && selected.size >= 3) { input.checked = false; toast('Select up to three methods at a time.'); return; }
    if (input.checked) selected.add(input.dataset.select); else selected.delete(input.dataset.select);
    updateSelection();
  });
  $('#clear-selection').addEventListener('click', () => { selected.clear(); render(); });
  $('#compare-methods').addEventListener('click', () => {
    const methods = [...selected].map((id) => data.methods.find((method) => method.id === id));
    if (methods.length < 2) return;
    const rows = metricInfo().metrics.map((metric) => `<tr><th scope="row">${escapeHTML(metric)}</th>${methods.map(() => '<td class="metric-value" aria-label="Not published">—</td>').join('')}</tr>`).join('');
    openDialog('Compare methods', 'METHOD COMPARISON', `<div class="dialog-meta"><span class="tag">${escapeHTML(model().name)}</span><span class="tag">${escapeHTML(task().label)}</span>${state.task === 'tool-use' ? `<span class="tag">${state.track === 'multi' ? 'Multi-turn' : 'Single-turn'}</span>` : ''}</div><div class="table-scroll" tabindex="0" role="region" aria-label="Selected methods comparison"><table class="results-table"><caption class="sr-only">Comparison preview. No evaluation results are published.</caption><thead><tr><th scope="col">Metric</th>${methods.map((method) => `<th scope="col">${escapeHTML(methodName(method))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p>Scores and configuration details will appear with published results. These entries are not ranked.</p>`, true);
  });
  $('#share-view').addEventListener('click', async () => {
    const link = location.href;
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(link); toast('Current view link copied.'); }
    catch {
      const dialog = openDialog('Share this view.', 'CURRENT FILTERS', `<p>Copy this link to reopen the same model, task, and filters.${location.protocol === 'file:' ? ' This local file link works only on a device with the website files.' : ''}</p><label><span class="sr-only">Current view URL</span><input class="share-input" readonly value="${escapeHTML(link)}"></label>`);
      dialog.querySelector('input').select();
    }
  });
  $('#export-csv').addEventListener('click', () => {
    const info = metricInfo();
    const rows = [['method', 'base_model', 'domain', 'track', 'type', ...info.metrics, 'result_status'], ...filteredMethods().map((method) => [methodName(method), model().name, task().label, state.task === 'tool-use' ? state.track : '', method.kind, ...info.metrics.map(() => ''), 'not_published'])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `rcb-catalogue-${state.model}-${state.task}${state.task === 'tool-use' ? `-${state.track}` : ''}.csv`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Catalogue exported. Unpublished scores are left empty.');
  });
})();
