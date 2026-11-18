const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

const directory = path.join(__dirname, '..', 'app', 'messages');
const css = fs.readFileSync(path.join(directory, 'messages.module.css'), 'utf8');
const classes = Object.fromEntries([...css.matchAll(/\.([A-Za-z]\w*)/g)].map(m => [m[1], m[1]]));
const conversation = { id: 'chat', otherUserId: 'customer', otherUserName: 'Customer with a long business name', lastMessage: 'Hello', lastMessageTime: Date.now(), unreadCount: 0 };

function harness(open, param = null, service = {}) {
  const states = [[conversation], open ? conversation : null, [
    { id: 'incoming', senderId: 'customer', text: 'Hello! '.repeat(50), timestamp: Date.now() },
    { id: 'outgoing', senderId: 'viewer', text: 'industrial'.repeat(30), timestamp: Date.now(), attachments: [{ fileName: 'catalog.pdf', fileUrl: '#', type: 'pdf' }] },
  ], '', [], false, false, false, true, 'connected', 0, open];
  const effects = [];
  const calls = [];
  let index = 0;
  const mocks = {
    react: { ...React, useState(initial) {
      const i = index++;
      if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    }, useEffect(effect) { effects.push(effect); }, useRef: () => ({ current: null }) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { useRouter: () => ({ push() {}, replace: url => calls.push(url) }), useSearchParams: () => ({ get: () => param }) },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'viewer' }, loading: false }) },
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    '@/lib/firebase-messaging': { messagingService: service },
    'emoji-picker-react': { default: () => null },
    './messages.module.css': { default: classes },
  };
  const exports = {};
  const source = fs.readFileSync(path.join(directory, 'page.tsx'), 'utf8') + '\nexport { MessagesContent };';
  const result = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  assert.equal(result.diagnostics.length, 0);
  vm.runInNewContext(result.outputText, {
    exports, console, setInterval, clearInterval,
    require(name) { assert.ok(name in mocks, `Unexpected dependency: ${name}`); return mocks[name]; },
  });
  return { states, calls, effects, render() { index = 0; effects.length = 0; return exports.MessagesContent(); } };
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) { const result = find(child, predicate); if (result) return result; }
    return;
  }
  return predicate(node) ? node : find(node.props?.children, predicate);
}

test('mobile conversation opens on selection and back returns to list and clears deep link', () => {
  const app = harness(false, 'customer');
  let tree = app.render();
  assert.doesNotMatch(tree.props.className, /chatOpen/);
  find(tree, n => n.type === 'button' && n.props['aria-pressed'] !== undefined).props.onClick();
  tree = app.render();
  assert.match(tree.props.className, /chatOpen/);
  assert.equal(app.states[1].otherUserId, 'customer');
  find(tree, n => n.props?.['aria-label'] === 'Back to conversations').props.onClick();
  tree = app.render();
  assert.doesNotMatch(tree.props.className, /chatOpen/);
  assert.equal(app.states[1], null);
  assert.equal(app.states[2].length, 0);
  assert.deepEqual(app.calls, ['/messages']);
});

test('leaving a chat unsubscribes and ignores late messages from its listener', async () => {
  let callback;
  let unsubscribed = false;
  const app = harness(true, null, {
    getMessages: async () => [{ id: 'loaded', receiverId: 'customer', read: true }],
    listenToMessages: (_, __, handler) => {
      callback = handler;
      return () => { unsubscribed = true; };
    },
  });
  app.render();
  const cleanup = app.effects[6]();
  await new Promise(setImmediate);
  assert.equal(app.states[2][0].id, 'loaded');
  cleanup();
  assert.equal(unsubscribed, true);
  await callback([{ id: 'stale', receiverId: 'customer' }]);
  assert.equal(app.states[2][0].id, 'loaded');
});

test('a closed conversation ignores an in-flight initial message response', async () => {
  let resolve;
  let subscriptions = 0;
  const app = harness(true, null, {
    getMessages: () => new Promise(done => { resolve = done; }),
    listenToMessages: () => { subscriptions++; },
  });
  app.render();
  const cleanup = app.effects[6]();
  cleanup();
  resolve([{ id: 'stale' }]);
  await new Promise(setImmediate);
  assert.equal(app.states[2].length, 0);
  assert.equal(subscriptions, 0);
});

test('chat composer still sends text and attachments and clears them after success', async () => {
  let sent;
  const app = harness(true, null, {
    sendMessage: async (...args) => { sent = args; return { timestamp: Date.now() }; },
    getMessages: async () => [{ id: 'sent', senderId: 'viewer', text: 'Hello customer' }],
  });
  app.states[3] = 'Hello customer';
  app.states[4] = [{ type: 'pdf', fileName: 'catalog.pdf', fileUrl: 'https://example.com/catalog.pdf' }];
  const tree = app.render();
  find(tree, n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.equal(sent[0], 'viewer');
  assert.equal(sent[2], 'customer');
  assert.equal(sent[4], 'Hello customer');
  assert.equal(sent[5][0].fileName, 'catalog.pdf');
  assert.equal(app.states[3], '');
  assert.equal(app.states[4].length, 0);
  assert.equal(app.states[5], false);
  assert.equal(app.states[2][0].id, 'sent');
});

for (const open of [false, true]) {
  test(`messaging ${open ? 'chat' : 'list'} preserves controls and renders responsive fixture`, () => {
    const app = harness(open);
    const tree = app.render();
    const html = renderToStaticMarkup(tree);
    assert.match(html, /Conversations/);
    if (open) {
      for (const label of ['Back to conversations', 'Message', 'Attach files', 'Add emoji', 'Send message']) assert.ok(html.includes(`aria-label="${label}"`));
      assert.match(html, /catalog\.pdf/);
      assert.match(html, /role="log"/);
    }
    if (process.env.MESSAGES_LAYOUT_FIXTURE_DIRECTORY) {
      fs.mkdirSync(process.env.MESSAGES_LAYOUT_FIXTURE_DIRECTORY, { recursive: true });
      fs.writeFileSync(path.join(process.env.MESSAGES_LAYOUT_FIXTURE_DIRECTORY, `messages-${open ? 'chat' : 'list'}.html`),
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body>${html}</body></html>`);
    }
  });
}
