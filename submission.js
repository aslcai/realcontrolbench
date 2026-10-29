(() => {
  'use strict';
  const form = document.querySelector('#submission-form');
  if (!form) return;
  const $ = (selector) => form.querySelector(selector);
  const stages = [...form.querySelectorAll('[data-stage]')];
  const stepButtons = [...document.querySelectorAll('[data-submission-step]')];
  const field = (id) => $('#' + id);
  const value = (id) => field(id).value.trim();
  let step = 0;
  let furthest = 0;
  let downloadURL = null;
  let submissionText = '';
  const identifier = crypto.randomUUID().slice(0, 8);

  function validateStage(index, report = true) {
    for (const input of stages[index].querySelectorAll('input, textarea, select')) {
      input.setCustomValidity('');
      const text = input.value.trim();
      if (input.required && !text) input.setCustomValidity('Please complete this field.');
      if (text && input.hasAttribute('data-http-url')) {
        try {
          const url = new URL(text);
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            input.setCustomValidity('Enter a public HTTP or HTTPS URL.');
          } else if (input.id === 'implementation-url' && value('implementation-type') === 'repository' &&
            (url.hostname !== 'github.com' || !/^\/[^/]+\/[^/]+\/?$/.test(url.pathname))) {
            input.setCustomValidity('Enter a GitHub repository URL, such as https://github.com/owner/repository.');
          }
        } catch {
          input.setCustomValidity('Enter a valid URL.');
        }
      }
      if (input.id === 'implementation-version' && /^(main|master|head|latest)$/i.test(text)) {
        input.setCustomValidity('Use a fixed commit SHA, release tag, or archive checksum.');
      }
      // Native validation also checks URL syntax and length constraints.
      if (!input.checkValidity()) {
        if (report) input.reportValidity();
        return false;
      }
    }
    return true;
  }

  function payload() {
    return {
      schema_version: 1,
      method: {
        name: value('method-name'),
        description: value('method-description'),
        authors: value('method-authors'),
        institution: value('method-institution') || null,
        paper_url: value('method-paper') || null
      },
      implementation: {
        type: value('implementation-type'),
        url: value('implementation-url'),
        version: value('implementation-version'),
        dependencies_and_configuration: value('implementation-config'),
        additional_artifacts: value('implementation-artifacts') || null
      }
    };
  }

  function reviewGroup(title, entries, editStep) {
    const section = document.createElement('section');
    const heading = document.createElement('div');
    heading.className = 'review-group-heading';
    const h4 = document.createElement('h4');
    h4.textContent = title;
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'review-edit';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', 'Edit ' + title);
    edit.addEventListener('click', () => showStep(editStep));
    heading.append(h4, edit);
    const list = document.createElement('dl');
    for (const [label, text] of entries) {
      if (!text) continue;
      const pair = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = text;
      pair.append(term, description);
      list.append(pair);
    }
    section.append(heading, list);
    return section;
  }

  function renderReview() {
    const data = payload();
    const method = data.method;
    const implementation = data.implementation;
    $('#submission-review').replaceChildren(
      reviewGroup('Method Information', [
        ['Method name', method.name], ['Short description', method.description], ['Authors', method.authors],
        ['Institution', method.institution], ['Paper URL', method.paper_url]
      ], 0),
      reviewGroup('Method Implementation', [
        [implementation.type === 'repository' ? 'GitHub repository' : 'Code archive', implementation.url],
        ['Fixed code version', implementation.version],
        ['Dependencies and configuration', implementation.dependencies_and_configuration],
        ['Additional artifacts', implementation.additional_artifacts]
      ], 1)
    );
    const slug = method.name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'method';
    const filename = slug + '-' + identifier + '.json';
    submissionText = JSON.stringify(data, null, 2) + '\n';
    $('#submission-json').textContent = submissionText;
    $('#submission-copy-status').textContent = '';
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = URL.createObjectURL(new Blob([submissionText], { type: 'application/json' }));
    $('#download-submission').href = downloadURL;
    $('#download-submission').download = filename;
    const url = new URL(window.RCB.repository + '/new/main');
    url.searchParams.set('filename', 'submissions/' + filename);
    url.searchParams.set('value', submissionText);
    const lengthy = url.href.length > 7000;
    if (lengthy) url.searchParams.delete('value');
    $('#submission-github').href = url.href;
    $('#submission-handoff').textContent = lengthy
      ? 'Copy the submission file below into the GitHub file editor, then finish your public pull request there.'
      : 'GitHub opens with your submission file. Finish your public pull request there.';
    $('.submission-file').open = lengthy;
  }

  function showStep(next) {
    step = next;
    furthest = Math.max(furthest, step);
    if (step === 2) renderReview();
    stages.forEach((stage, index) => {
      stage.hidden = index !== step;
      stage.disabled = index !== step;
    });
    stepButtons.forEach((button, index) => {
      button.disabled = index > furthest;
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#submission-back').hidden = step === 0;
    $('#submission-next').hidden = step === 2;
    $('#submission-next').textContent = step === 1 ? 'Review submission' : 'Continue';
    $('#submission-github').hidden = step !== 2;
    $('#submission-status').textContent = 'Step ' + (step + 1) + ' of 3: ' + stages[step].querySelector('h3').textContent;
    stages[step].querySelector('h3').focus({ preventScroll: true });
  }

  function advanceTo(next) {
    if (next > step && !validateStage(step)) return;
    // Revisiting an earlier step and clearing a required field must also block review.
    if (next === 2) {
      for (let index = 0; index < 2; index++) {
        stages[index].disabled = false;
        const valid = validateStage(index, false);
        stages[index].disabled = index !== step;
        if (!valid) {
          showStep(index);
          validateStage(index);
          return;
        }
      }
    }
    showStep(next);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (step < 2) advanceTo(step + 1);
  });
  $('#submission-back').addEventListener('click', () => showStep(Math.max(0, step - 1)));
  stepButtons.forEach((button) => button.addEventListener('click', () => advanceTo(Number(button.dataset.submissionStep))));
  form.addEventListener('input', (event) => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
  });
  $('#implementation-type').addEventListener('change', () => {
    const archive = value('implementation-type') === 'archive';
    $('#implementation-url-label').textContent = archive ? 'Code archive URL' : 'GitHub repository URL';
    $('#implementation-url').placeholder = archive ? 'https://…/method.zip' : 'https://github.com/owner/repository';
    $('#implementation-url').setCustomValidity('');
  });
  $('#copy-submission').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(submissionText);
      $('#submission-copy-status').textContent = 'Submission copied.';
    } catch {
      $('#submission-copy-status').textContent = 'Select and copy the text below, or download the JSON file.';
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#submission-json'));
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
  $('#submission-github').addEventListener('click', () => {
    $('#submission-status').textContent = 'Continue on GitHub to create the pull request. Your submission is not sent until you finish there.';
  });
})();
