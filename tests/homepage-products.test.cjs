const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function load(relativePath, mocks) {
  const filename = path.join(__dirname, '..', relativePath);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const exports = {};
  vm.runInNewContext(result.outputText, {
    exports, console: { error() {} },
    require(name) { assert.ok(name in mocks, `Unexpected dependency ${name}`); return mocks[name]; },
  }, { filename });
  return exports;
}

function service(getDocs) {
  return load(path.join('lib', 'homepage-products.ts'), {
    './firebase': { db: {} },
    'firebase/firestore': {
      collection: (_, name) => name,
      orderBy: (...args) => args,
      limit: n => n,
      query: (...args) => args,
      getDocs,
    },
  });
}

const product = i => ({
  id: `product-${i}`, productName: `Industrial bearing ${i}`, timestamp: i + 1,
  brand: `Brand ${i}`, category: 'Bearings', price: '', imageUri: '', location: 'Dubai',
});

test('homepage queries the newest 60 public products and maps only public display fields', async () => {
  const api = service(async query => {
    assert.equal(JSON.stringify(query), JSON.stringify(['publicProducts', ['timestamp', 'desc'], 60]));
    return { docs: [{ id: 'canonical', data: () => ({ ...product(1), id: 'spoof', email: 'private' }) }] };
  });
  const items = await api.getHomeProducts();
  assert.equal(items[0].id, 'canonical');
  assert.equal('email' in items[0], false);
  assert.equal(Object.keys(items[0]).length, 9);
  await assert.rejects(service(async () => { throw new Error('permission-denied'); }).getHomeProducts(), /permission-denied/);
  await assert.rejects(service(async () => ({ docs: [{ id: 'invalid', data: () => ({}) }] })).getHomeProducts(), /Invalid public product/);
});

test('brands are real trimmed values, case-insensitive unique, sorted and limited to six', () => {
  const { getHomeBrands } = service();
  const products = [product(1), { ...product(2), brand: ' brand 1 ' }, ...Array.from({ length: 8 }, (_, i) => product(i + 3)), { ...product(0), brand: ' ' }];
  const brands = getHomeBrands(products);
  assert.equal(brands.length, 6);
  assert.equal(brands.filter(b => b.toLowerCase() === 'brand 1').length, 1);
  assert.deepEqual(Array.from(getHomeBrands([])), []);
  assert.deepEqual(Array.from(brands), Array.from(brands).sort((a, b) => a.localeCompare(b)));
});

function harness({ user = { uid: 'buyer', displayName: 'Buyer name' }, products = [], getProducts = async () => products, createPost = async () => 'saved-id', runtime } = {}) {
  const states = [];
  const setters = [];
  const effects = [];
  const refs = [];
  let cursor = 0;
  let refCursor = 0;
  const jsx = (type, props) => ({ type, props });
  const Component = load(path.join('components', 'HomeDiscovery.tsx'), {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        setters[index] = value => { states[index] = value; };
        return [states[index], setters[index]];
      },
      useRef(initial) { const index = refCursor++; return refs[index] || (refs[index] = { current: initial }); },
      useEffect(effect) { effects.push(effect); },
    },
    'react/jsx-runtime': runtime || { jsx, jsxs: jsx },
    'next/link': { default: 'a' },
    '@/lib/auth-context': { useAuth: () => ({ user, loading: false }) },
    '@/lib/firebase-service': { productService: { createPost } },
    '@/lib/homepage-products': { getHomeProducts: getProducts, getHomeBrands: service().getHomeBrands },
    './HomeDiscovery.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
    './RecentlyViewed': { default: () => null },
    './HomepageExtras': { default: () => null },
    './HomepageSaveButton': { default: () => null },
    '@/lib/discovery-country': load(path.join('lib', 'discovery-country.ts'), {}),
  }).default;
  return { states, setters, effects, render() { cursor = 0; refCursor = 0; return Component(); } };
}

function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => all(child, predicate));
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join(' ');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
const validRequest = { productName: ' Bearing ', quantity: ' 100 pieces ', category: 'Bearings', location: ' Dubai, UAE ', description: ' Model 6205, new ' };
const submit = h => all(h.render(), n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} });

test('discovery displays only six actual products, encoded brand links and signed-out account prompts', async () => {
  const h = harness({ user: null, products: [{ ...product(0), brand: 'A & B' }, ...Array.from({ length: 9 }, (_, i) => product(i + 1))] });
  h.render();
  h.effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  const tree = h.render();
  assert.equal(all(tree, n => /^\/product-/.test(n.props?.href)).length, 6);
  assert.ok(all(tree, n => n.props?.href === '/feed?brand=A%20%26%20B').length);
  assert.match(text(tree), /Contact for price/);
  assert.match(text(tree), /Sign in/);
  assert.equal(all(tree, n => n.type === 'form').length, 0);
});

test('buying request validates fields, prevents duplicate saves and reports real persistence before success', async () => {
  let calls = 0;
  let complete;
  const h = harness({ createPost: async post => {
    calls++;
    assert.equal(post.postType, 'BUY');
    assert.equal(post.creatorId, 'buyer');
    assert.equal(post.userId, 'buyer');
    assert.equal(post.productName, 'Bearing');
    assert.equal(post.quantity, '100 pieces');
    assert.equal(post.location, 'Dubai, UAE');
    assert.equal(post.description, 'Quantity required: 100 pieces\nModel 6205, new');
    await new Promise(resolve => { complete = resolve; });
    return 'saved-id';
  } });
  await submit(h);
  assert.match(text(h.render()), /Complete the product/);
  assert.equal(calls, 0);
  h.setters[3](validRequest);
  const pending = submit(h);
  await submit(h);
  assert.equal(calls, 1);
  assert.doesNotMatch(text(h.render()), /Your buying request is published/);
  complete();
  await pending;
  assert.match(text(h.render()), /Your buying request is published/);
  assert.equal(all(h.render(), n => n.props?.href === '/saved-id').length, 1);
});

test('failed requests preserve entered details; loading, empty and read failure states are explicit', async () => {
  const h = harness({ createPost: async () => { throw new Error('permission-denied'); } });
  assert.match(text(h.render()), /Loading latest products/);
  h.effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(text(h.render()), /No products available yet/);
  h.setters[3](validRequest);
  await submit(h);
  assert.match(text(h.render()), /could not be published/);
  assert.equal(h.states[3], validRequest);
  const failed = harness({ getProducts: async () => { throw new Error('offline'); } });
  failed.render();
  failed.effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(text(failed.render()), /Unable to load products/);
  assert.doesNotMatch(text(failed.render()), /No products available yet/);
});

test('brand feed filter is exact and case-insensitive and composes with existing filters', () => {
  const filename = path.join(__dirname, '..', 'app', 'feed', 'page.tsx');
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let effect;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0].getText(source).includes('setFilteredProducts(filtered)')) effect = node.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(effect);
  const run = ts.transpileModule(`(${effect.getText(source)})();`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const products = [
    { ...product(1), brand: ' SKF ' }, { ...product(2), brand: 'skf' },
    { ...product(3), brand: 'SKF aftermarket' }, { ...product(4), brand: '' },
  ];
  products[0] = { ...products[0], modelNumber: '6205', condition: 'New', minimumOrderQuantity: '10', minimumOrderUnit: 'pieces' };
  products[1] = { ...products[1], modelNumber: '6305', condition: 'Used', minimumOrderQuantity: '100', minimumOrderUnit: 'kg' };
  const context = {
    products, selectedBrand: 'sKf', selectedSupplier: '', searchQuery: '', selectedCategory: 'All',
    selectedCondition: '', maxMinimumOrder: '', minimumOrderUnit: '',
    matchesProductSearch: load(path.join('lib', 'product-details.ts'), {}).matchesProductSearch,
    locationScope: 'All Countries', sortBy: 'newest', normalizeCategoryValue: s => s.toLowerCase(),
    getCountryValue: p => p.location, console,
    setFilteredProducts(value) { context.result = value; },
  };
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-2', 'product-1']);
  context.searchQuery = 'bearing 1';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-1']);
  context.searchQuery = '';
  context.selectedBrand = '';
  vm.runInNewContext(run, context);
  assert.equal(context.result.length, 4);
  context.selectedCondition = 'New';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-1']);
  context.selectedCondition = '';
  context.searchQuery = 'SKF 6205';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-1']);
  context.searchQuery = '';
  context.maxMinimumOrder = '10';
  context.minimumOrderUnit = 'pieces';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-1']);
  context.maxMinimumOrder = '9';
  vm.runInNewContext(run, context);
  assert.equal(context.result.length, 0);
  context.maxMinimumOrder = '1000';
  context.minimumOrderUnit = 'kg';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-2']);
  context.maxMinimumOrder = '';
  context.minimumOrderUnit = '';
  context.products = [
    { ...product(1), creatorId: 'supplier', location: 'Dubai, UAE' },
    { ...product(2), userId: 'supplier', location: 'India' },
    { ...product(3), creatorId: 'supplier', location: 'UAE', postType: 'BUY' },
    { ...product(4), creatorId: 'different', userId: 'supplier', location: 'UAE' },
  ];
  context.selectedSupplier = 'supplier';
  context.getCountryValue = p => load(path.join('lib', 'discovery-country.ts'), {}).discoveryCountry(p.location);
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-2', 'product-1']);
  context.locationScope = 'United Arab Emirates';
  vm.runInNewContext(run, context);
  assert.deepEqual(Array.from(context.result, p => p.id), ['product-1']);
});

test('discovery renders responsive product cards, real brand tiles and labelled quotation inputs', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const h = harness({ runtime: require('react/jsx-runtime') });
  h.render();
  const long = 'IndustrialBearing'.repeat(12);
  h.setters[0](Array.from({ length: 6 }, (_, i) => ({ ...product(i), productName: long, brand: long + i, location: long })));
  h.setters[1](false);
  const markup = renderToStaticMarkup(h.render());
  assert.match(markup, /id="request-quotation"/);
  assert.match(markup, /class="products"/);
  assert.match(markup, /Publish buying request/);
  assert.match(markup, /Quantity and unit/);
  if (process.env.HOME_DISCOVERY_FIXTURE_DIRECTORY) {
    const css = fs.readFileSync(path.join(__dirname, '..', 'components', 'HomeDiscovery.module.css'), 'utf8');
    fs.mkdirSync(process.env.HOME_DISCOVERY_FIXTURE_DIRECTORY, { recursive: true });
    fs.writeFileSync(path.join(process.env.HOME_DISCOVERY_FIXTURE_DIRECTORY, 'home-discovery.html'),
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;font-family:Arial}main{max-width:1280px;margin:auto}a{text-decoration:none}${css}</style></head><body><main>${markup}</main></body></html>`);
  }
});

test('clearing a feed brand preserves the other URL filters', () => {
  const filename = path.join(__dirname, '..', 'app', 'feed', 'page.tsx');
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'button' &&
        node.children.some(child => ts.isJsxText(child) && child.text.includes('Clear brand filter'))) {
      handler = node.openingElement.attributes.properties.find(p => p.name?.getText(source) === 'onClick').initializer.expression;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(handler);
  const run = ts.transpileModule(`(${handler.getText(source)})();`, {}).outputText;
  let destination;
  vm.runInNewContext(run, {
    URLSearchParams,
    searchParams: new URLSearchParams('brand=SKF&category=Bearings&search=6205'),
    router: { replace: value => { destination = value; } },
  });
  assert.equal(destination, '/feed?category=Bearings&search=6205');
});
