(() => {
  'use strict';
  const link = document.querySelector('#submission-github');
  if (!link) return;
  const template = `# Method submission

## Method information
- Method name:
- Short description:
- Authors:
- Institution (optional):
- Paper URL (optional):

## Method implementation
- GitHub repository or code archive URL:
- Fixed code version (commit SHA, release tag, or archive checksum):
- Dependencies, configuration, and run command:
- Additional artifacts (optional):
`;
  const url = new URL(window.RCB.repository + '/new/main');
  url.searchParams.set('filename', 'submissions/method-' + crypto.randomUUID().slice(0, 8) + '.md');
  url.searchParams.set('value', template);
  link.href = url.href;
})();
