const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function compile(relative) {
  const result = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
  return result.outputText;
}
function load(relative, mocks = {}) {
  const exports = {};
  vm.runInNewContext(compile(relative), {
    exports, console: { error() {} }, crypto: webcrypto, TextEncoder,
    require(name) { assert.ok(name in mocks, `Unexpected dependency ${name}`); return mocks[name]; },
  });
  return exports;
}
const countryApi = load('lib\\discovery-country.ts');
const css = { default: new Proxy({}, { get: (_, key) => key }) };
const product = { id: 'bearing', productName: 'Bearing 6205', brand: 'SKF', modelNumber: '6205', price: '100', location: 'Dubai, UAE', imageUri: '', timestamp: 1, category: 'Bearings' };
const supplier = { id: 'supplier', name: 'Supplier fixture', username: 'supplier', region: 'UAE', joinedAt: 1735689600000, productCount: 2, reviewCount: 0, avgRating: 0 };
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness(relative, mocks = {}, actor = { user: { uid: 'buyer' }, loading: false }) {
  const states = [], refs = [], effects = [], deps = [], cleanups = [];
  let stateIndex, refIndex, effectIndex;
  const jsx = (type, props) => ({ type, props });
  const Component = load(relative, {
    react: {
      useState(initial) {
        const i = stateIndex++;
        if (!(i in states)) states[i] = initial;
        return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
      },
      useRef(initial) { const i = refIndex++; return refs[i] || (refs[i] = { current: initial }); },
      useEffect(effect, next) {
        const i = effectIndex++;
        if (!deps[i] || next.some((value, j) => value !== deps[i][j])) {
          effects.push(() => { cleanups[i]?.(); cleanups[i] = effect(); });
          deps[i] = next;
        }
      },
      useId: () => 'suggestions',
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': { default: 'a' },
    '@/lib/auth-context': { useAuth: () => actor },
    './HomepageExtras.module.css': css,
    '@/lib/discovery-country': countryApi,
    ...mocks,
    '@/lib/homepage-discovery': { getPublicBuyers: async () => [], ...mocks['@/lib/homepage-discovery'] },
  }).default;
  return {
    states, actor,
    render(props = {}) { stateIndex = refIndex = effectIndex = 0; return Component(props); },
    effects() { while (effects.length) effects.shift()(); },
  };
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
const element = (tree, type, label) => all(tree, node => node.type === type && (!label || text(node).includes(label)))[0];
const change = (tree, label, value) => element(tree, 'label', label).props.children.find(node => node?.props?.onChange).props.onChange({ target: { value } });

test('country discovery normalizes actual countries and never calls a city a country', () => {
  for (const value of ['UAE', 'Dubai, uae', 'Dubai UAE', 'United Arab Emirates']) assert.equal(countryApi.discoveryCountry(value), 'United Arab Emirates');
  assert.equal(countryApi.discoveryCountry('Mumbai, India'), 'India');
  assert.equal(countryApi.discoveryCountry('India'), 'India');
  for (const value of ['Papua New Guinea', 'Equatorial Guinea', 'South Sudan']) {
    assert.equal(countryApi.discoveryCountry(value), value);
    assert.equal(countryApi.discoveryCountry(`City, ${value}`), value);
  }
  assert.equal(countryApi.discoveryCountry('Dubai'), '');
  assert.equal(countryApi.discoveryCountry('Anywhere'), '');
  assert.equal(countryApi.sameTradingCountry('Dubai, UAE', 'United Arab Emirates'), true);
  assert.equal(countryApi.sameTradingCountry('India', 'UAE'), false);
  assert.equal(countryApi.sameTradingCountry('Dubai', ''), true);
});

test('global country choices contain all 249 ISO countries and territories without duplicates', () => {
  const countries = Array.from(countryApi.TRADING_COUNTRIES);
  assert.equal(countries.length, 249);
  assert.equal(new Set(countries).size, 249);
  assert.deepEqual(countries, [...countries].sort((a, b) => a.localeCompare(b, 'en')));
  for (const name of ['India', 'United Arab Emirates', 'Canada', 'Japan', 'Brazil', 'South Africa', 'Palestinian Territories', 'Vatican City', 'Turkey']) {
    assert.ok(countries.includes(name), `${name} is available`);
  }
  for (const country of countries) assert.equal(countryApi.discoveryCountry(country), country);
});

test('homepage country selector stays global before data loads and shows honest empty results', async () => {
  const h = harness('components\\HomepageExtras.tsx', {
    '@/lib/homepage-discovery': {
      getPublicSuppliers: async () => [],
      getSavedSearches: async () => [],
    },
  });
  const props = { country: 'Canada', onCountryChange() {}, productsLoading: true };
  let tree = h.render(props);
  assert.equal(all(tree, node => node.type === 'option').length, 250);
  assert.ok(all(tree, node => node.type === 'option' && text(node) === 'Canada').length);
  assert.ok(all(tree, node => node.props?.href === '/feed?country=Canada').length);
  h.effects(); await tick();
  tree = h.render({ ...props, productsLoading: false });
  assert.equal(all(tree, node => node.type === 'option').length, 250);
  assert.match(text(tree), /No suppliers match this country yet/);
  assert.doesNotMatch(text(tree), /Supplier fixture/);
});

function service(entries = {}) {
  const documents = new Map(Object.entries(entries)), writes = [];
  const api = load('lib\\homepage-discovery.ts', {
    './firebase': { db: {} },
    'firebase/firestore': {
      collection: (_, name) => name, doc: (_, collection, id) => `${collection}/${id}`,
      orderBy: (...args) => args, where: (...args) => args, limit: value => value, query: (...args) => args,
      getDoc: async ref => ({ exists: () => documents.has(ref) }),
      setDoc: async (ref, value) => { writes.push([ref, value]); documents.set(ref, value); },
      deleteDoc: async ref => { documents.delete(ref); },
      getDocs: async ([collection]) => ({
        docs: [...documents].filter(([ref]) => ref.startsWith(collection + '/')).map(([ref, data]) => ({ id: ref.split('/')[1], data: () => data })),
      }),
    },
  });
  return { api, documents, writes };
}
test('saved searches validate criteria, deduplicate normalized terms per owner and support removal', async () => {
  const { api, documents, writes } = service();
  await assert.rejects(api.saveSearch('buyer', '', ''), /Enter a brand/);
  await assert.rejects(api.saveSearch('buyer', 'a'.repeat(101), ''), /100 characters/);
  await api.saveSearch('buyer', ' SKF ', '6205');
  await api.saveSearch('buyer', 'skf', '6205');
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1].brand, 'SKF');
  await api.saveSearch('different', 'SKF', '6205');
  assert.equal(writes.length, 2);
  assert.notEqual(writes[0][0], writes[1][0]);
  const searches = await api.getSavedSearches('buyer');
  assert.equal(searches[0].brand, 'SKF');
  await api.removeSavedSearch(searches[0].id);
  assert.equal(documents.size, 1);
});
test('activity service persists at most one catalogue search per account per UTC day', async () => {
  const { api, writes } = service();
  await api.recordCatalogSearch('buyer', 'bearing', ' SKF ');
  await api.recordCatalogSearch('buyer', 'other', 'Other');
  assert.equal(writes.length, 1);
  assert.match(writes[0][0], /^searchActivity\/buyer_\d+$/);
  assert.equal(writes[0][1].term, 'SKF');
});

test('public buyers query latest 100 by real join date and map only approved fields', async () => {
  const { api, documents } = service({
    'publicBuyers/canonical': { ...supplier, id: 'spoofed', email: 'private', phone: 'private' },
  });
  const buyers = await api.getPublicBuyers();
  assert.equal(buyers[0].id, 'canonical');
  assert.deepEqual(Object.keys(buyers[0]).sort(), ['id', 'name', 'username', 'region', 'joinedAt', 'avgRating', 'reviewCount'].sort());
  documents.set('publicBuyers/canonical', { ...supplier, joinedAt: NaN });
  await assert.rejects(api.getPublicBuyers(), /Invalid buyer summary/);
});

test('recent buyers are newest-first, limited to six, country-filtered and exclude unknown dates', async () => {
  const buyers = Array.from({ length: 8 }, (_, i) => ({ ...supplier, id: `buyer-${i}`, name: `Buyer ${i}`, joinedAt: i + 1 }));
  const h = harness('components\\HomepageExtras.tsx', {
    '@/lib/homepage-discovery': {
      getPublicBuyers: async () => [...buyers, { ...supplier, id: 'unknown', joinedAt: 0 }, { ...supplier, id: 'india-buyer', region: 'India', joinedAt: 99 }],
      getPublicSuppliers: async () => [],
      getSavedSearches: async () => [],
    },
  }, { user: null, loading: false });
  const props = { country: '', onCountryChange() {}, productsLoading: false, productsError: false };
  assert.match(text(h.render(props)), /Loading buyers/);
  h.effects(); await tick();
  const section = tree => all(tree, node => node.props?.id === 'buyer-discovery')[0];
  const links = tree => all(section(tree), node => node.type === 'a');
  assert.equal(links(h.render(props)).length, 6);
  assert.equal(links(h.render(props))[0].props.href, '/profile/india-buyer');
  const local = h.render({ ...props, country: 'UAE' });
  assert.equal(links(local)[0].props.href, '/profile/buyer-7');
  assert.equal(links(local).length, 6);
  assert.doesNotMatch(text(section(local)), /product listings|Browse catalogue|Supplier storefront/);
  assert.match(text(section(local)), /No reviews yet/);
  assert.match(text(section(h.render({ ...props, country: 'Canada' }))), /No buyers match this country yet/);
});

test('buyer discovery errors are independent from supplier results and never appear as an empty success', async () => {
  const h = harness('components\\HomepageExtras.tsx', {
    '@/lib/homepage-discovery': {
      getPublicBuyers: async () => { throw new Error('permission-denied'); },
      getPublicSuppliers: async () => [supplier],
      getSavedSearches: async () => [],
    },
  });
  const props = { country: '', onCountryChange() {} };
  h.render(props); h.effects(); await tick();
  assert.match(text(h.render(props)), /Buyer discovery could not load/);
  assert.match(text(h.render(props)), /Supplier fixture/);
  assert.doesNotMatch(text(h.render(props)), /No buyers with a recorded registration date/);
});
test('public discovery mapping excludes private fields and surfaces invalid summaries', async () => {
  const { api, documents } = service({
    'publicSuppliers/supplier': { ...supplier, email: 'private' },
    'publicSearchStats/skf': { term: 'SKF', count: 2, userId: 'private' },
  });
  assert.equal('email' in (await api.getPublicSuppliers())[0], false);
  assert.equal('userId' in (await api.getPopularSearches())[0], false);
  documents.set('publicSuppliers/supplier', { ...supplier, productCount: -1 });
  await assert.rejects(api.getPublicSuppliers(), /Invalid supplier/);
  documents.set('publicSearchStats/skf', { term: 'SKF', count: NaN });
  await assert.rejects(api.getPopularSearches(), /Invalid search activity/);
});

test('smart search supports keyboard suggestions and records only exact catalogue matches before routing', async () => {
  const destinations = [], activity = [];
  const h = harness('components\\HomepageSearch.tsx', {
    'next/navigation': { useRouter: () => ({ push: value => destinations.push(value) }) },
    '@/lib/homepage-products': { getHomeProducts: async () => [product] },
    '@/lib/homepage-discovery': { getPopularSearches: async () => [{ term: 'SKF', count: 1 }], recordCatalogSearch: async (...args) => activity.push(args) },
  });
  h.render(); h.effects(); await tick();
  element(h.render(), 'input').props.onChange({ target: { value: '62' } });
  element(h.render(), 'input').props.onKeyDown({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(element(h.render(), 'input').props['aria-activedescendant'], 'suggestions-0');
  await element(h.render(), 'form').props.onSubmit({ preventDefault() {} });
  await tick();
  assert.equal(destinations[0], '/feed?search=6205');
  assert.deepEqual(activity[0], ['buyer', 'bearing', '6205']);
  element(h.render(), 'input').props.onChange({ target: { value: 'not a catalogue label' } });
  element(h.render(), 'form').props.onSubmit({ preventDefault() {} });
  await tick();
  assert.equal(activity.length, 1);
  assert.equal(destinations[1], '/feed?search=not%20a%20catalogue%20label');
});

test('search errors remain visible without blocking ordinary searching or inventing popularity', async () => {
  const destinations = [];
  const h = harness('components\\HomepageSearch.tsx', {
    'next/navigation': { useRouter: () => ({ push: value => destinations.push(value) }) },
    '@/lib/homepage-products': { getHomeProducts: async () => { throw new Error('offline'); } },
    '@/lib/homepage-discovery': { getPopularSearches: async () => { throw new Error('offline'); } },
  });
  h.render(); h.effects(); await tick();
  assert.match(text(h.render()), /Suggestions unavailable.*Popular searches could not load/);
  assert.doesNotMatch(text(h.render()), /Based on signed-in activity/);
  element(h.render(), 'form').props.onSubmit({ preventDefault() {} });
  await tick();
  assert.equal(destinations[0], '/feed');
});

test('supplier cards use real review/join states, country links, and saved searches persist/remove via on-site alerts', async () => {
  let records = [], removed = [];
  const h = harness('components\\HomepageExtras.tsx', {
    '@/lib/homepage-discovery': {
      getPublicSuppliers: async () => [supplier, { ...supplier, id: 'unknown-date', joinedAt: 0, region: 'India' }],
      getSavedSearches: async () => records,
      saveSearch: async (uid, brand, modelNumber) => { assert.equal(uid, 'buyer'); records = [{ id: 'saved', brand, modelNumber }]; },
      removeSavedSearch: async id => removed.push(id),
    },
  });
  const props = { products: [product], country: 'UAE', onCountryChange() {} };
  h.render(props); h.effects(); await tick();
  let tree = h.render(props);
  assert.match(text(tree), /No reviews yet/);
  assert.equal(all(tree, n => n.props?.href?.startsWith('/feed?supplier=supplier')).length, 2);
  assert.equal(all(tree, n => n.props?.href?.startsWith('/profile/unknown-date')).length, 0);
  assert.doesNotMatch(text(tree), /4.8/);
  change(tree, 'Brand to watch', 'SKF');
  change(h.render(props), 'Model / part number to watch', '6205');
  await element(h.render(props), 'form').props.onSubmit({ preventDefault() {} });
  assert.match(text(h.render(props)), /New matching listings will appear in Notifications/);
  await element(h.render(props), 'button', 'Remove alert').props.onClick();
  assert.deepEqual(removed, ['saved']);
  h.actor.user = null; h.render(props); h.effects();
  assert.match(text(h.render(props)), /Sign in to save searches/);
  assert.doesNotMatch(text(h.render(props)), /Remove alert/);
});

test('saved-search loading failures are explicit and delayed account results never leak after sign-out', async () => {
  let complete;
  const h = harness('components\\HomepageExtras.tsx', {
    '@/lib/homepage-discovery': {
      getPublicSuppliers: async () => { throw new Error('offline'); },
      getSavedSearches: async () => new Promise(resolve => { complete = resolve; }),
    },
  });
  const props = { products: [], country: '', onCountryChange() {} };
  h.render(props); h.effects(); await tick();
  assert.match(text(h.render(props)), /Supplier discovery could not load/);
  h.actor.user = null; h.render(props); h.effects();
  complete([{ id: 'private', brand: 'Private brand', modelNumber: '' }]);
  await tick();
  assert.doesNotMatch(text(h.render(props)), /Private brand/);
});

test('homepage save buttons fetch authenticated seller details, toggle persistence and subscribe to changes', async () => {
  let listener, unsubscribe = 0;
  const additions = [], removals = [];
  const h = harness('components\\HomepageSaveButton.tsx', {
    '@/lib/firebase-service': { productService: { getPostById: async id => ({ ...product, creatorId: 'supplier', creatorName: 'Actual supplier' }) } },
    '@/lib/firebase-wishlist': { wishlistService: {
      listenToWishlist: (uid, callback) => { listener = callback; callback([]); return () => { unsubscribe++; }; },
      addToWishlist: async (...args) => { additions.push(args); return 'saved'; },
      removeFromWishlist: async id => removals.push(id),
    } },
  });
  h.render({ product }); h.effects();
  await element(h.render({ product }), 'button').props.onClick();
  assert.deepEqual(additions[0], ['buyer', 'bearing', 'Bearing 6205', '100', 'Actual supplier', 'supplier', '']);
  assert.equal(element(h.render({ product }), 'button').props['aria-pressed'], true);
  await element(h.render({ product }), 'button').props.onClick();
  assert.deepEqual(removals, ['saved']);
  listener([{ id: 'other-tab', productId: 'bearing' }]);
  assert.equal(element(h.render({ product }), 'button').props['aria-pressed'], true);
  h.actor.user = null; h.render({ product }); h.effects();
  assert.equal(unsubscribe, 1);
  assert.match(text(h.render({ product })), /Sign in to save/);
});

test('homepage wishlist failures do not claim a successful save', async () => {
  const h = harness('components\\HomepageSaveButton.tsx', {
    '@/lib/firebase-service': { productService: { getPostById: async () => { throw new Error('permission-denied'); } } },
    '@/lib/firebase-wishlist': { wishlistService: { listenToWishlist: (uid, callback) => callback([]) } },
  });
  h.render({ product }); h.effects();
  await element(h.render({ product }), 'button').props.onClick();
  assert.match(text(h.render({ product })), /could not be updated/);
  assert.equal(element(h.render({ product }), 'button').props['aria-pressed'], false);
});

test('optional interactive homepage fixture uses the actual components with isolated test services', () => {
  if (!process.env.HOMEPAGE_DISCOVERY_FIXTURE_DIRECTORY) return;
  const modules = {};
  for (const relative of [
    'components\\AmazonStyleHome.tsx', 'components\\HomepageSearch.tsx', 'components\\HomepageExtras.tsx',
    'components\\HomepageSaveButton.tsx', 'components\\HomeDiscovery.tsx', 'lib\\discovery-country.ts',
  ]) modules[relative] = compile(relative);
  const reactRoot = path.dirname(require.resolve('react/package.json'));
  const domRoot = path.dirname(require.resolve('react-dom/package.json'));
  const browserReact = fs.readFileSync(path.join(reactRoot, 'umd', 'react.development.js'), 'utf8');
  const browserDom = fs.readFileSync(path.join(domRoot, 'umd', 'react-dom.development.js'), 'utf8');
  const styles = ['HomepageExtras', 'HomeDiscovery'].map(name => fs.readFileSync(path.join(__dirname, '..', 'components', name + '.module.css'), 'utf8')).join('\n');
  const script = `
    const modules = ${JSON.stringify(modules)}, cache = {};
    const product = ${JSON.stringify(product)}, supplier = ${JSON.stringify(supplier)};
    const products = [product, {...product, id:'india', productName:'Industrial bearing India', location:'India'}, {...product, id:'long', productName:'VeryLongProduct'.repeat(18)}];
    let searches = [], wishlist = []; const listeners = new Set();
    const calls = {routes:[], activity:[], searches:[], saves:[]}; window.fixtureCalls = calls;
    const Auth = React.createContext(null);
    const jsx=(type,props,key)=>React.createElement(type,key===undefined?props:{...props,key});
    const jsxr = {jsx,jsxs:jsx,Fragment:React.Fragment};
    const services = {
      getPublicBuyers:async()=>[{...supplier,id:'buyer-fixture',name:'VeryLongBuyerName'.repeat(16)},{...supplier,id:'buyer-india',name:'India buyer',region:'India'}],
      getPublicSuppliers:async()=>[supplier,{...supplier,id:'india',region:'India',name:'India supplier'},{...supplier,id:'long',name:'VeryLongSupplierName'.repeat(14)}],
      getPopularSearches:async()=>[{term:'SKF',count:1}],
      getSavedSearches:async()=>searches,
      saveSearch:async(uid,brand,modelNumber)=>{ if(!brand.trim()&&!modelNumber.trim())throw Error('Enter a brand or part number'); searches=[{id:'search',brand,modelNumber}];calls.searches.push([uid,brand,modelNumber]); },
      removeSavedSearch:async()=>{searches=[]},
      recordCatalogSearch:async(...args)=>calls.activity.push(args),
    };
    const wishlistService={
      listenToWishlist:(uid,callback)=>{listeners.add(callback);callback(wishlist);return()=>listeners.delete(callback)},
      addToWishlist:async(...args)=>{calls.saves.push(args);wishlist=[{id:'saved',productId:args[1]}];listeners.forEach(callback=>callback(wishlist));return 'saved'},
      removeFromWishlist:async()=>{wishlist=[];listeners.forEach(callback=>callback(wishlist))},
    };
    function load(name){
      if(cache[name])return cache[name];
      const exports={};cache[name]=exports;
      new Function('require','exports',modules[name])(mock,exports);return exports;
    }
    function mock(name){
      if(name==='react')return React;
      if(name==='react/jsx-runtime')return jsxr;
      if(name.endsWith('.module.css'))return {default:new Proxy({},{get:(_,key)=>key})};
      if(name==='next/link')return {default:({href,children,...props})=>React.createElement('a',{href,...props,onClick:event=>{if(!href.startsWith('#')){event.preventDefault();calls.routes.push(href)}}},children)};
      if(name==='next/navigation')return {useRouter:()=>({push:path=>calls.routes.push(path)})};
      if(name==='@/lib/auth-context')return {useAuth:()=>React.useContext(Auth)};
      if(name==='@/lib/toast-context')return {useToast:()=>({addToast:()=>{}})};
      if(name==='@/lib/firebase-reviews')return {getPublicRatedUsers:async()=>[],compareUserRatings:()=>0};
      if(name==='@/lib/homepage-products')return {getHomeProducts:async()=>products,getHomeBrands:()=>['SKF']};
      if(name==='@/lib/homepage-discovery')return services;
      if(name==='@/lib/firebase-wishlist')return {wishlistService};
      if(name==='@/lib/firebase-service')return {productService:{getPostById:async()=>({...product,creatorId:'supplier',creatorName:'Supplier fixture'}),createPost:async()=> 'request'}};
      if(name==='@/lib/discovery-country')return load('lib\\\\discovery-country.ts');
      if(name==='./RecentlyViewed'||name==='@/components/PromotionRequestForm')return {default:()=>null};
      const component=name.split('/').pop();
      return load('components\\\\'+component+'.tsx');
    }
    function Fixture(){
      const [user,setUser]=React.useState({uid:'buyer',displayName:'VeryLongMemberName'.repeat(16)});
      return React.createElement(Auth.Provider,{value:{user,loading:false}},
        React.createElement('button',{onClick:()=>setUser(user?null:{uid:'buyer',displayName:'Mobile fixture'})},'Toggle fixture sign-in'),
        React.createElement(load('components\\\\AmazonStyleHome.tsx').default));
    }
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Fixture));
  `;
  fs.mkdirSync(process.env.HOMEPAGE_DISCOVERY_FIXTURE_DIRECTORY, { recursive: true });
  fs.writeFileSync(path.join(process.env.HOMEPAGE_DISCOVERY_FIXTURE_DIRECTORY, 'homepage-discovery.html'),
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial}a{text-decoration:none;color:inherit}${styles}</style></head><body><div id="root"></div><script>${browserReact}</script><script>${browserDom}</script><script>${script.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
});
