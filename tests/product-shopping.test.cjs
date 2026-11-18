const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const filename = path.join(__dirname, '..', file);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.length, 0, file);
  const exports = {};
  vm.runInNewContext(result.outputText, {
    exports, console: { error() {} }, URL, ...globals,
    require(name) { assert.ok(name in mocks, `Unexpected import ${name}`); return mocks[name]; },
  });
  return exports;
}
const details = load(path.join('lib', 'product-details.ts'));
const recent = load(path.join('lib', 'recently-viewed.ts'));
const file = (name = 'photo(1).png', size = 5 * 1024 * 1024, type = 'image/png') => ({ name, size, type });

function harness(file, mocks = {}, globals = {}) {
  const states = [], refs = [], effects = [];
  let index = 0, refIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const Component = load(file, {
    react: {
      useState(initial) {
        const i = index++;
        if (!(i in states)) states[i] = initial;
        return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
      },
      useRef(initial) { const i = refIndex++; return refs[i] || (refs[i] = { current: initial }); },
      useEffect(effect) { effects.push(effect); },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': { default: 'a' },
    './ProductShopping.module.css': { default: new Proxy({}, { get: (_, name) => name }) },
    '@/lib/product-details': details,
    ...mocks,
  }, globals);
  return {
    states, refs, effects,
    render(props, name = 'default') { index = 0; refIndex = 0; return Component[name](props); },
  };
}
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(item => all(item, predicate));
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
const button = (tree, label) => all(tree, n => n.type === 'button' && n.props.children === label)[0];

test('photos enforce exactly ten images and five MB per image, including existing photos', () => {
  assert.doesNotThrow(() => details.validateProductPhotos(Array.from({ length: 10 }, () => file())));
  assert.throws(() => details.validateProductPhotos(Array.from({ length: 11 }, () => file())), /up to 10/);
  assert.throws(() => details.validateProductPhotos([file()], 10), /up to 10/);
  assert.throws(() => details.validateProductPhotos([file('large.png', 5 * 1024 * 1024 + 1)]), /5 MB/);
  assert.throws(() => details.validateProductPhotos([file('fake.png', 100, 'application/pdf')]), /choose a PNG/);
  assert.doesNotThrow(() => details.validateProductPhotos([file('test.jpg', 100, 'image/jpeg')], 9));
});

test('image lists preserve legacy cover URLs, deduplicate, reject unsafe URLs and cap at ten', () => {
  const old = 'https://example.com/old(1).png';
  assert.deepEqual(Array.from(details.getProductImages({ imageUri: old })), [old]);
  assert.deepEqual(Array.from(details.getProductImages({ imageUrl: old })), [old]);
  assert.deepEqual(Array.from(details.getProductImages({ imageUris: ['javascript:bad', old, old, 123] })), [old]);
  assert.equal(details.getProductImages({ imageUri: old, imageUris: Array.from({ length: 15 }, (_, i) => `https://example.com/${i}.png`) }).length, 10);
});

test('structured details require valid condition and paired positive MOQ/unit; search covers brand and part number', () => {
  const base = { ...details.emptySpecifications };
  assert.doesNotThrow(() => details.validateSpecifications(base));
  assert.throws(() => details.validateSpecifications({ ...base, condition: 'Guaranteed' }), /condition/);
  for (const quantity of ['0', '-1', 'invalid', 'Infinity']) {
    assert.throws(() => details.validateSpecifications({ ...base, minimumOrderQuantity: quantity, minimumOrderUnit: 'kg' }), /positive/);
  }
  assert.throws(() => details.validateSpecifications({ ...base, minimumOrderQuantity: '1' }), /both/);
  assert.doesNotThrow(() => details.validateSpecifications({ ...base, minimumOrderQuantity: '0.5', minimumOrderUnit: 'kg' }));
  assert.equal(details.matchesProductSearch({ productName: 'Bearing', brand: 'SKF', modelNumber: '6205-2RS' }, 'SKF 6205'), true);
  assert.equal(details.matchesProductSearch({ productName: 'Bearing', brand: 'SKF', modelNumber: '6205-2RS' }, 'SKF 6305'), false);
});

test('gallery changes photos, navigates, zooms and closes with native dialog support', () => {
  const h = harness(path.join('components', 'ProductGallery.tsx'));
  const props = { images: ['https://example.com/one.png', 'https://example.com/two.png'], name: 'Bearing' };
  let tree = h.render(props);
  all(tree, n => n.props?.['aria-label'] === 'Show photo 2')[0].props.onClick();
  tree = h.render(props);
  assert.ok(all(tree, n => n.type === 'img' && n.props.src === props.images[1]).length);
  all(tree, n => n.props?.['aria-label'] === 'Enlarge Bearing')[0].props.onClick();
  tree = h.render(props);
  button(tree, 'Next photo').props.onClick();
  tree = h.render(props);
  assert.equal(h.states[0], 0);
  button(tree, 'Zoom in').props.onClick();
  tree = h.render(props);
  assert.equal(all(tree, n => n.props?.['data-zoomed'] === true).length, 1);
  all(tree, n => n.type === 'dialog')[0].props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(h.states[0], 1);
  tree = h.render(props);
  button(tree, 'Close photos').props.onClick();
  assert.equal(h.states[1], false);
  tree = h.render(props);
  assert.equal(button(tree, 'Zoom in'), undefined);
  all(tree, n => n.props?.['aria-label'] === 'Enlarge Bearing')[0].props.onClick();
  tree = h.render(props);
  all(tree, n => n.type === 'dialog')[0].props.onKeyDown({ key: 'Escape', preventDefault() {} });
  assert.equal(h.states[1], false);
});

test('history is bounded, newest-first, deduplicated, account-scoped and failures propagate', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  for (let i = 0; i < 20; i++) recent.recordRecentlyViewed(storage, 'user-a', `product-${i}`);
  recent.recordRecentlyViewed(storage, 'user-a', 'product-12');
  const ids = Array.from(recent.readRecentlyViewed(storage, 'user-a'));
  assert.equal(ids.length, 12);
  assert.equal(ids[0], 'product-12');
  assert.equal(new Set(ids).size, 12);
  assert.deepEqual(Array.from(recent.readRecentlyViewed(storage, 'user-b')), []);
  assert.throws(() => recent.recordRecentlyViewed({ getItem() { throw new Error('blocked'); } }, 'a', 'id'), /blocked/);
  values.set(recent.recentProductsKey('user-a'), 'not JSON');
  assert.throws(() => recent.readRecentlyViewed(storage, 'user-a'));
});

test('recent history loads current listings, skips deleted/BUY posts, clears and hides on account switch', async () => {
  const values = new Map([[recent.recentProductsKey('buyer'), JSON.stringify(['one', 'deleted', 'request', 'two'])]]);
  let account = { uid: 'buyer' };
  const localStorage = {
    getItem: key => values.get(key), removeItem: key => values.delete(key),
  };
  const h = harness(path.join('components', 'RecentlyViewed.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: account }) },
    '@/lib/firebase-service': { productService: { getPostById: async id =>
      id === 'deleted' ? null : { id: 'stale', productName: id, postType: id === 'request' ? 'BUY' : 'SELL', price: '' },
    } },
    '@/lib/recently-viewed': recent,
    './HomeDiscovery.module.css': { default: {} },
  }, { window: { localStorage, addEventListener() {}, removeEventListener() {} } });
  h.render();
  const cleanup = h.effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  let tree = h.render();
  assert.deepEqual(all(tree, n => n.type === 'a').map(n => n.props.href), ['/one', '/two']);
  account = { uid: 'different' };
  assert.equal(h.render(), null);
  account = { uid: 'buyer' };
  tree = h.render();
  button(tree, 'Clear history').props.onClick();
  assert.equal(values.has(recent.recentProductsKey('buyer')), false);
  assert.equal(h.render(), null);
  cleanup();
});

test('recent history reports blocked storage and never writes browsing history for BUY requests', async () => {
  let writes = 0;
  const h = harness(path.join('components', 'RecentlyViewed.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'buyer' } }) },
    '@/lib/firebase-service': { productService: {} },
    '@/lib/recently-viewed': recent,
    './HomeDiscovery.module.css': { default: {} },
  }, { window: {
    localStorage: { getItem() { throw new Error('blocked'); }, setItem() { writes++; } },
    addEventListener() {}, removeEventListener() {},
  } });
  h.render({ id: 'request', postType: 'BUY' }, 'ViewedProductTracker');
  h.effects[0]();
  assert.equal(writes, 0);
  const listing = harness(path.join('components', 'RecentlyViewed.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'buyer' } }) },
    '@/lib/firebase-service': { productService: {} },
    '@/lib/recently-viewed': recent, './HomeDiscovery.module.css': { default: {} },
  }, { window: { localStorage: { getItem() { throw new Error('blocked'); } }, addEventListener() {}, removeEventListener() {} } });
  listing.render();
  listing.effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(all(listing.render(), n => n.props?.role === 'alert').length);
});

function createHarness(createPost, uploadPhotos) {
  const pushes = [];
  const h = harness(path.join('app', 'create-post', 'page.tsx'), {
    'next/navigation': { useRouter: () => ({ push: url => pushes.push(url) }) },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'supplier', displayName: 'Supplier' }, loading: false }) },
    '@/lib/firebase-service': {
      productService: { createPost, uploadProductPhotos: uploadPhotos },
      userService: { getUserProfile: async () => ({ name: 'Supplier' }) },
    },
    '@/lib/firebase': { storage: {} },
    'firebase/storage': {},
    '@/components/ProductPhotosPicker': { default: 'photo-picker' },
    '@/components/ProductSpecificationsFields': { default: 'specification-fields' },
  });
  h.render();
  h.states[0] = { ...h.states[0], productName: 'Bearing', description: 'New bearing', brand: ' SKF ', modelNumber: ' 6205 ', condition: 'New', minimumOrderQuantity: '10', minimumOrderUnit: 'pieces' };
  h.states[1] = [file()];
  return { h, pushes };
}
const submit = h => all(h.render(), n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} });

test('creating a listing waits for all photos and saves cover, gallery and structured specifications', async () => {
  let saved;
  const urls = ['https://example.com/one.png', 'https://example.com/two.png'];
  const { h, pushes } = createHarness(async post => { saved = post; return 'id'; }, async (uid, files) => {
    assert.equal(uid, 'supplier');
    assert.equal(files.length, 1);
    return urls;
  });
  await submit(h);
  assert.equal(saved.imageUri, urls[0]);
  assert.deepEqual(Array.from(saved.imageUris), urls);
  assert.equal(saved.brand, 'SKF');
  assert.equal(saved.modelNumber, '6205');
  assert.equal(saved.condition, 'New');
  assert.equal(saved.minimumOrderQuantity, '10');
  assert.deepEqual(pushes, ['/feed']);
});

test('photo failures never create a partial listing or navigate away; draft and photos remain', async () => {
  const { h, pushes } = createHarness(async () => assert.fail('Must not publish without photos'), async () => { throw new Error('Upload denied'); });
  await submit(h);
  assert.equal(h.states[0].productName, 'Bearing');
  assert.equal(h.states[1].length, 1);
  assert.match(h.states[4], /Upload denied/);
  assert.deepEqual(pushes, []);
});

test('upload service validates first, uses unique paths and returns ordered download URLs', async () => {
  const uploads = [];
  const { productService } = load(path.join('lib', 'firebase-service.ts'), {
    'firebase/auth': {}, 'firebase/firestore': {},
    'firebase/storage': {
      ref: (_, key) => key,
      uploadBytes: async (key, image, metadata) => { uploads.push({ key, image, metadata }); },
      getDownloadURL: async key => `https://example.com/${key}`,
    },
    './firebase': { storage: {} }, './firebase-notifications': {},
    './product-details': details,
  }, { crypto: { randomUUID: () => 'unique' } });
  const urls = await productService.uploadProductPhotos('supplier', [file(), file('second.png', 10)]);
  assert.equal(urls.length, 2);
  assert.match(uploads[0].key, /^products\/supplier\/unique_0_photo\(1\).png$/);
  assert.equal(uploads[0].metadata.contentType, 'image/png');
  await assert.rejects(productService.uploadProductPhotos('supplier', Array.from({ length: 11 }, () => file())), /up to 10/);
  assert.equal(uploads.length, 2);
});

test('editing a legacy listing preserves its photos and saves new specifications and gallery in one update', async () => {
  let saved;
  const alerts = [];
  const h = harness(path.join('app', 'profile', 'page.tsx'), {
    './account.module.css': { default: {} },
    'next/navigation': { useRouter: () => ({}) },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'supplier' }, loading: false }) },
    '@/lib/firebase-service': { productService: {
      uploadProductPhotos: async (uid, files, existing) => {
        assert.equal(existing, 1);
        return ['https://example.com/new.png'];
      },
      updatePost: async (id, update) => { saved = { id, update }; },
    } },
    '@/lib/realtime-sync': {}, '@/lib/firebase-reviews': {},
    '@/components/ProductPhotosPicker': { default: 'photo-picker' },
    '@/components/ProductSpecificationsFields': { default: 'specification-fields' },
  }, { alert: message => alerts.push(message) });
  h.render();
  const source = fs.readFileSync(path.join(__dirname, '..', 'app', 'profile', 'page.tsx'), 'utf8');
  const stateNames = [...source.matchAll(/const \[(\w+),\s*\w+\] = useState/g)].map(match => match[1]);
  const set = (name, value) => { h.states[stateNames.indexOf(name)] = value; };
  const legacy = { id: 'legacy', productName: 'Bearing', description: 'Bearing', imageUri: 'https://example.com/legacy.png' };
  set('loading', false);
  set('activeTab', 'products');
  set('userProducts', [legacy]);
  let tree = h.render();
  button(tree, 'Edit').props.onClick();
  tree = h.render();
  const picker = all(tree, n => n.type === 'photo-picker')[0];
  assert.deepEqual(Array.from(picker.props.existing), [legacy.imageUri]);
  picker.props.onChange([file()]);
  const fields = all(tree, n => n.type === 'specification-fields')[0];
  fields.props.onChange({ ...fields.props.value, modelNumber: '6205', condition: 'New' });
  tree = h.render();
  await button(tree, 'Save').props.onClick();
  assert.equal(saved.id, 'legacy');
  assert.equal(saved.update.modelNumber, '6205');
  assert.deepEqual(Array.from(saved.update.imageUris), [legacy.imageUri, 'https://example.com/new.png']);
  assert.equal(saved.update.imageUri, legacy.imageUri);
  assert.deepEqual(alerts, []);
});

test('interactive shopping fixture uses the actual gallery and form components', () => {
  if (!process.env.PRODUCT_SHOPPING_FIXTURE_DIRECTORY) return;
  const directory = process.env.PRODUCT_SHOPPING_FIXTURE_DIRECTORY;
  const css = fs.readFileSync(path.join(__dirname, '..', 'components', 'ProductShopping.module.css'), 'utf8');
  const classes = Object.fromEntries([...css.matchAll(/\.([A-Za-z]\w*)/g)].map(match => [match[1], match[1]]));
  const modules = {};
  for (const name of ['ProductGallery', 'ProductPhotosPicker', 'ProductSpecificationsFields']) {
    modules[`./${name}`] = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', 'components', `${name}.tsx`), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText;
  }
  modules['@/lib/product-details'] = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', 'lib', 'product-details.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const script = `
    const sources=${JSON.stringify(modules)}, cache={};
    function require(name) {
      if(name==='react') return React;
      if(name==='react/jsx-runtime') return {Fragment:React.Fragment,jsx:(type,props,key)=>React.createElement(type,{...props,key}),jsxs:(type,props,key)=>React.createElement(type,{...props,key})};
      if(name==='./ProductShopping.module.css') return {default:${JSON.stringify(classes)}};
      if(cache[name]) return cache[name];
      const exports={}; cache[name]=exports; new Function('exports','require',sources[name])(exports,require); return exports;
    }
    const Gallery=require('./ProductGallery').default, Picker=require('./ProductPhotosPicker').default, Fields=require('./ProductSpecificationsFields').default;
    const images=Array.from({length:10},(_,i)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="'+(i%2?'lightblue':'lightgreen')+'"/><text x="50" y="150">Photo '+(i+1)+'</text></svg>'));
    function App() {
      const [files,setFiles]=React.useState([]), [fields,setFields]=React.useState(require('@/lib/product-details').emptySpecifications);
      return React.createElement('main',null,React.createElement(Gallery,{images,name:'Industrial bearing'}),React.createElement(Fields,{value:fields,onChange:setFields}),React.createElement(Picker,{files,onChange:setFiles}));
    }
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  `;
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'shopping.html'), `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;font-family:Arial}main{max-width:900px;margin:auto;min-width:0}${css}</style></head><body><div id="root"></div><script>${fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd', 'react.development.js'), 'utf8')}</script><script>${fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd', 'react-dom.development.js'), 'utf8')}</script><script>${script}</script></body></html>`);
});
