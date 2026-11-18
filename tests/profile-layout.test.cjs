const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

const directory = path.join(__dirname, '..', 'app', 'profile', '[userId]');
const css = fs.readFileSync(path.join(directory, 'profile.module.css'), 'utf8');
const classes = Object.fromEntries(
  [...css.matchAll(/\.([A-Za-z]\w*)/g)].map((match) => [match[1], match[1]])
);

function renderProfile(profile, posts, status) {
  const state = [profile, posts, false, { avg: 4.8, count: 5 }, false, status];
  let index = 0;
  const mocks = {
    react: {
      useState: () => [state[index++], () => assert.fail('Unexpected state change during render')],
      useEffect() {},
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/navigation': { useParams: () => ({ userId: 'fixture-user' }), useRouter: () => ({}) },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    './profile.module.css': { default: classes },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'viewer' }, loading: false }) },
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    '@/lib/firebase-service': {},
    '@/lib/firebase-notifications': {},
    '@/lib/firebase-reviews': {},
  };
  const exports = {};
  const result = ts.transpileModule(fs.readFileSync(path.join(directory, 'page.tsx'), 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.length, 0);
  vm.runInNewContext(result.outputText, {
    exports,
    require(name) {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    },
  });
  return renderToStaticMarkup(React.createElement(exports.default));
}

for (const status of ['none', 'pending', 'connected']) {
  test(`profile layout preserves content and ${status} connection action`, () => {
    const longToken = 'industrial'.repeat(12);
    const profile = {
      name: 'Hristo Stoyanov Stoyanov',
      role: 'buyer',
      region: 'Germany',
      email: `${longToken}@example.com`,
      phone: '+49 123456789',
    };
    const posts = status === 'pending' ? [] : [{
      id: 'example-post',
      productName: longToken,
      description: 'Industrial product with a long title to exercise narrow layouts.',
      location: longToken,
      category: 'Bearings',
    }];
    const markup = renderProfile(profile, posts, status);
    assert.match(markup, /Hristo Stoyanov Stoyanov/);
    assert.match(markup, /Profile Snapshot/);
    assert.match(markup, /class="detailsGrid"/);
    assert.match(markup, /class="identity"/);
    assert.match(markup, /4\.8 \(5 reviews\)/);
    assert.match(markup, status === 'none' ? /Connect/ : status === 'pending' ? /Pending/ : /Message/);
    assert.match(markup, posts.length ? /class="listing"/ : /No posts yet/);

    if (process.env.PROFILE_LAYOUT_FIXTURE_DIRECTORY) {
      fs.mkdirSync(process.env.PROFILE_LAYOUT_FIXTURE_DIRECTORY, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.PROFILE_LAYOUT_FIXTURE_DIRECTORY, `profile-${status}.html`),
        `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body>${markup}</body></html>`
      );
    }
  });
}
