const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'app', 'profile', 'account.module.css'), 'utf8');
const classes = Object.fromEntries([...css.matchAll(/\.([A-Za-z]\w*)/g)].map(match => [match[1], match[1]]));
for (const editing of [false, true]) {
  test(`own account mobile layout retains identity and ${editing ? 'edit fields' : 'account details'}`, () => {
    const source = fs.readFileSync(path.join(root, 'app', 'profile', 'page.tsx'), 'utf8');
    const names = [...source.matchAll(/const \[(\w+),\s*\w+\] = useState/g)].map(match => match[1]);
    const profile = {
      name: 'Rahul Suthar Industrial Trading Company',
      username: 'Rahul11rise' + 'longusername'.repeat(6),
      region: 'United Arab Emirates',
      phone: '+971 541635009',
      email: 'industrial'.repeat(14) + '@example.com',
      role: 'buyer',
    };
    const values = {
      activeTab: 'info', isEditing: editing, profileData: profile, tempData: profile,
      userProducts: [], connections: [], loading: false, ratingSummary: { avg: 0, count: 0 },
      ratingsError: false, photoUploading: false, editingPostId: null, showDeleteModal: false,
      postToDelete: null, editingPostData: {}, editingPhotos: [], newPhotos: [], savingPost: false,
    };
    let index = 0;
    const mocks = {
      react: { useState: () => [values[names[index++]], () => {}], useEffect() {}, useRef: () => ({ current: false }) },
      'react/jsx-runtime': require('react/jsx-runtime'),
      'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
      'next/navigation': { useRouter: () => ({}) },
      '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'self' }, loading: false }) },
      '@/lib/firebase-service': {}, '@/lib/realtime-sync': {}, '@/lib/firebase-reviews': {},
      '@/lib/product-details': { emptySpecifications: {} },
      '@/components/ProductPhotosPicker': { default: () => null },
      '@/components/ProductSpecificationsFields': { default: () => null },
      './account.module.css': { default: classes },
    };
    const result = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
    assert.equal(result.diagnostics.length, 0);
    const exports = {};
    vm.runInNewContext(result.outputText, { exports, require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
    const markup = renderToStaticMarkup(React.createElement(exports.default));
    assert.match(markup, /class="identity"/);
    assert.match(markup, /class="actions"/);
    assert.match(markup, /class="tabs"/);
    assert.match(markup, /aria-current="page"/);
    assert.match(markup, /Rahul Suthar/);
    assert.match(markup, editing ? /Save Changes/ : /No reviews/);
    if (process.env.ACCOUNT_LAYOUT_FIXTURE_DIRECTORY) {
      fs.mkdirSync(process.env.ACCOUNT_LAYOUT_FIXTURE_DIRECTORY, { recursive: true });
      fs.writeFileSync(path.join(process.env.ACCOUNT_LAYOUT_FIXTURE_DIRECTORY, `account-${editing ? 'edit' : 'info'}.html`),
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial}a{text-decoration:none}${css}</style></head><body>${markup}</body></html>`);
    }
  });
}
