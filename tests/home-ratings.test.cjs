const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(relativePath, mocks, globals = {}) {
  const filename = path.join(__dirname, '..', relativePath);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error).length, 0, `Syntax errors in ${relativePath}`);
  const source = result.outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    URL,
    require(name) {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    },
    console: { error() {}, warn() {} },
    ...globals,
  }, { filename });
  return exports;
}

function ratingModule(getDocs) {
  return loadModule(path.join('lib', 'firebase-reviews.ts'), {
    'firebase/firestore': {
      collection: (_, name) => name,
      getDocs,
      where: (field, operator, value) => ({ field, operator, value }),
      query: (collection, filter) => ({ collection, filter }),
    },
    './firebase': { db: {} },
  });
}

const ratingService = (getDocs) => ratingModule(getDocs).reviewService;
const { compareUserRatings } = ratingModule(async () => ({ docs: [] }));

test('public rating reads use only the public collection and never return private fields', async () => {
  const { getPublicRatedUsers } = ratingModule(async (collection) => {
    assert.equal(collection, 'publicUserRatings');
    return { docs: [{
      id: 'canonical',
      data: () => ({
        uid: 'stale', name: 'Buyer', username: 'buyer', region: 'UAE', role: 'buyer',
        avgRating: 4.8, reviewCount: 5, email: 'private', phone: 'private',
      }),
    }] };
  });
  const users = await getPublicRatedUsers();
  assert.equal(users[0].uid, 'canonical');
  assert.equal(users[0].avgRating, 4.8);
  assert.equal(users[0].reviewCount, 5);
  assert.equal('email' in users[0], false);
  assert.equal('phone' in users[0], false);
});

test('public rating query failures and malformed summaries are not presented as unrated users', async () => {
  const error = new Error('permission-denied');
  await assert.rejects(
    ratingModule(async () => { throw error; }).getPublicRatedUsers(),
    (cause) => cause === error
  );
  await assert.rejects(
    ratingModule(async () => ({ docs: [{ id: 'invalid', data: () => ({ role: 'buyer' }) }] }))
      .getPublicRatedUsers(),
    /Invalid public rating summary/
  );
});

const reviewDoc = (id, revieweeId, rating) => ({
  id,
  data: () => ({ revieweeId, rating }),
});

test('user star averages include every valid review without an ordered query', async () => {
  const service = ratingService(async (collection) => {
    assert.equal(collection, 'reviews');
    return { docs: [
      reviewDoc('1', 'buyer', 5),
      reviewDoc('2', 'buyer', '4'),
      reviewDoc('3', 'supplier', 3),
      reviewDoc('4', 'buyer', 0),
      reviewDoc('5', 'supplier', 6),
      reviewDoc('6', 'supplier', 'invalid'),
      reviewDoc('7', undefined, 5),
      reviewDoc('8', 'supplier', true),
    ] };
  });
  const ratings = await service.getUserRatingSummaries();
  assert.equal(ratings.get('buyer').avg, 4.5);
  assert.equal(ratings.get('buyer').count, 2);
  assert.equal(ratings.get('supplier').avg, 3);
  assert.equal(ratings.get('supplier').count, 1);
  assert.equal(ratings.size, 2);
});

test('individual ratings use the canonical reviewee ID and the same valid averages as homepage', async () => {
  const service = ratingService(async (query) => {
    assert.equal(query.collection, 'reviews');
    assert.deepEqual({ ...query.filter }, { field: 'revieweeId', operator: '==', value: 'buyer-id' });
    return { docs: [
      reviewDoc('1', 'buyer-id', 5),
      reviewDoc('2', 'buyer-id', '4'),
      reviewDoc('3', 'buyer-id', 'invalid'),
      reviewDoc('4', 'buyer-id', 0),
    ] };
  });
  const rating = await service.getUserAverageRating('buyer-id');
  assert.equal(rating.avg, 4.5);
  assert.equal(rating.count, 2);

  const empty = await ratingService(async () => ({ docs: [] })).getUserAverageRating('no-reviews');
  assert.equal(empty.avg, 0);
  assert.equal(empty.count, 0);
  const error = new Error('permission-denied');
  await assert.rejects(
    ratingService(async () => { throw error; }).getUserAverageRating('buyer-id'),
    (cause) => cause === error
  );
});

test('empty reviews produce no summaries; query failures are not zero ratings', async () => {
  const empty = await ratingService(async () => ({ docs: [] })).getUserRatingSummaries();
  assert.equal(empty.size, 0);
  const failure = new Error('permission-denied');
  await assert.rejects(
    ratingService(async () => { throw failure; }).getUserRatingSummaries(),
    (error) => error === failure
  );
});

async function loadHomepage(profiles, ratings, error) {
  const states = [];
  const effects = [];
  const jsx = () => null;
  const component = loadModule(path.join('components', 'AmazonStyleHome.tsx'), {
    react: {
      useState(initial) {
        const index = states.length;
        states.push(initial);
        return [initial, (value) => { states[index] = value; }];
      },
      useEffect(effect) { effects.push(effect); },
      useRef: () => ({ current: false }),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({}) },
    'next/link': {},
    '@/lib/firebase-reviews': {
      compareUserRatings,
      async getPublicRatedUsers() {
        if (error) throw error;
        return profiles.filter(([, profile]) => ['buyer', 'supplier'].includes(profile.role))
          .map(([id, profile]) => ({
            ...profile,
            uid: id,
            avgRating: ratings.get(id)?.avg ?? 0,
            reviewCount: ratings.get(id)?.count ?? 0,
          }));
      },
    },
    '@/lib/auth-context': { useAuth: () => ({ user: null }) },
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    '@/components/PromotionRequestForm': { default: () => null },
    '@/components/HomeDiscovery': { default: () => null },
    '@/components/HomepageSearch': { default: () => null },
    './HomepageExtras.module.css': { default: {} },
  }).default;
  component();
  effects[1]();
  await new Promise(setImmediate);
  return states;
}

test('homepage ranks buyers and suppliers by stars, then review count, before limiting to four', async () => {
  const profiles = [
    ['unrated', { role: 'supplier' }],
    ['supplier', { role: 'supplier', uid: 'wrong-id' }],
    ['buyer', { role: 'buyer' }],
    ['tie', { role: 'supplier' }],
    ['lower', { role: 'buyer' }],
    ['admin', { role: 'admin' }],
  ];
  const ratings = new Map([
    ['buyer', { avg: 5, count: 1 }],
    ['supplier', { avg: 4.5, count: 3 }],
    ['tie', { avg: 4.5, count: 2 }],
    ['lower', { avg: 4, count: 50 }],
    ['admin', { avg: 5, count: 100 }],
  ]);
  const [users, loading, error] = await loadHomepage(profiles, ratings);
  assert.deepEqual(Array.from(users, (user) => user.uid), ['buyer', 'supplier', 'tie', 'lower']);
  assert.equal(users[0].role, 'buyer');
  assert.equal(users[1].reviewCount, 3);
  assert.equal(loading, false);
  assert.equal(error, false);
});

test('homepage puts unrated users last and distinguishes failure from an empty list', async () => {
  const [users] = await loadHomepage(
    [['unrated', { role: 'buyer' }], ['rated', { role: 'supplier' }]],
    new Map([['rated', { avg: 1, count: 1 }]])
  );
  assert.deepEqual(Array.from(users, (user) => user.uid), ['rated', 'unrated']);
  const [emptyUsers, loading, error] = await loadHomepage([], new Map(), new Error('unavailable'));
  assert.equal(emptyUsers.length, 0);
  assert.equal(loading, false);
  assert.equal(error, true);
});

function componentHarness(relativePath, mocks) {
  const states = [];
  const setters = [];
  let effects = [];
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const component = loadModule(relativePath, {
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        setters[index] = (value) => {
          states[index] = typeof value === 'function' ? value(states[index]) : value;
        };
        return [states[index], setters[index]];
      },
      useEffect(effect) { effects.push(effect); },
      useRef: () => ({ current: false }),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': {},
    'next/navigation': { useRouter: () => ({ push() {} }) },
    ...mocks,
  }).default;
  return {
    states,
    setters,
    get effects() { return effects; },
    render(props) {
      stateIndex = 0;
      effects = [];
      return component(props);
    },
  };
}

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(textContent).join(' ').replace(/\s+/g, ' ');
  if (typeof node === 'object') return textContent(node.props?.children);
  return String(node);
}

test('homepage uses an honest member heading when reviews do not exist', () => {
  const harness = componentHarness(path.join('components', 'AmazonStyleHome.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: null, loading: false }) },
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    '@/lib/firebase-reviews': { compareUserRatings },
    '@/components/PromotionRequestForm': { default: () => null },
    '@/components/HomeDiscovery': { default: () => null },
    '@/components/HomepageSearch': { default: () => null },
    './HomepageExtras.module.css': { default: {} },
  });
  harness.render();
  harness.setters[0]([{ uid: 'unrated', role: 'buyer', reviewCount: 0, avgRating: 0 }]);
  harness.setters[1](false);
  assert.match(textContent(harness.render()), /Discover buyers & suppliers/);
  assert.doesNotMatch(textContent(harness.render()), /Top-rated buyers and suppliers/);
  harness.setters[0]([{ uid: 'rated', role: 'supplier', reviewCount: 5, avgRating: 4.8 }]);
  assert.match(textContent(harness.render()), /Buyer & supplier ratings/);
});

function findElement(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
    return undefined;
  }
  return node.type === type ? node : findElement(node.props?.children, type);
}

test('promotion form is in a native collapsed disclosure on both pages without changing submission', async () => {
  let submissions = 0;
  for (const id of ['promotion-request', 'brand-promotion-request']) {
    const harness = componentHarness(path.join('components', 'PromotionRequestForm.tsx'), {
      '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'requester' }, loading: false }) },
      '@/lib/firebase-promotion-requests': {
        async submitPromotionRequest(details) {
          assert.equal(details.companyName, 'Acme');
          submissions++;
          return 'saved-reference';
        },
      },
    });
    let tree = harness.render({ id });
    const disclosure = findElement(tree, 'details');
    assert.ok(disclosure);
    assert.equal(disclosure.props.open, undefined);
    const summary = findElement(disclosure, 'summary');
    assert.match(textContent(summary), /List and promote your brand and products/);
    assert.equal(findElement(summary, 'form'), undefined);
    assert.ok(findElement(disclosure, 'form'));
    harness.setters[0]({ companyName: 'Acme' });
    tree = harness.render({ id });
    let prevented = false;
    await findElement(tree, 'form').props.onSubmit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.match(textContent(harness.render({ id })), /Promotion request submitted for review/);
    assert.match(textContent(harness.render({ id })), /saved-reference/);
  }
  assert.equal(submissions, 2);
});

test('collapsed promotion disclosure retains account prompts and save errors inside its content', async () => {
  for (const account of [{ user: null, loading: true }, { user: null, loading: false }]) {
    const harness = componentHarness(path.join('components', 'PromotionRequestForm.tsx'), {
      '@/lib/auth-context': { useAuth: () => account },
      '@/lib/firebase-promotion-requests': { submitPromotionRequest: async () => assert.fail('Unexpected submission') },
    });
    const disclosure = findElement(harness.render({ id: 'promotion-request' }), 'details');
    assert.equal(disclosure.props.open, undefined);
    assert.match(textContent(disclosure), account.loading ? /Checking your account/ : /Create an account or sign in/);
  }
  const harness = componentHarness(path.join('components', 'PromotionRequestForm.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'requester' }, loading: false }) },
    '@/lib/firebase-promotion-requests': { submitPromotionRequest: async () => { throw { code: 'permission-denied' }; } },
  });
  const tree = harness.render({ id: 'promotion-request' });
  await findElement(tree, 'form').props.onSubmit({ preventDefault() {} });
  assert.match(textContent(harness.render({ id: 'promotion-request' })), /access was denied/);
});

test('network search preserves ratings and ranking, supports UID, and excludes the signed-in user', async () => {
  let reads = 0;
  const harness = componentHarness(path.join('app', 'network', 'page.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'self' }, loading: false }) },
    '@/lib/firebase-service': { connectionService: {} },
    '@/lib/realtime-sync': { listenToAllUsers() {} },
    '@/lib/firebase-notifications': { notificationService: {} },
    '@/lib/firebase-reviews': {
      compareUserRatings,
      reviewService: {
        async getUserRatingSummaries() {
          reads++;
          return new Map([
            ['self', { avg: 5, count: 10 }],
            ['high-id', { avg: 4.8, count: 5 }],
            ['tie-id', { avg: 4.8, count: 2 }],
            ['low-id', { avg: 3, count: 1 }],
          ]);
        },
      },
    },
  });
  harness.render();
  harness.setters[0]([
    { uid: 'self', name: 'Shared Self' },
    { uid: 'low-id', name: 'Shared Low' },
    { uid: 'tie-id', name: 'Shared Tie' },
    { uid: 'high-id', name: 'Shared High' },
  ]);
  harness.setters[6](false);
  harness.render();
  harness.effects[1]();
  await new Promise(setImmediate);
  assert.deepEqual(Array.from(harness.states[1], (profile) => profile.uid), ['high-id', 'tie-id', 'low-id']);
  for (const search of ['Shared', ' HIGH-ID ', '']) {
    harness.setters[7](search);
    const text = textContent(harness.render());
    assert.match(text, /Shared High/);
    assert.match(text, /4\.8/);
    assert.match(text, /5 reviews/);
    assert.doesNotMatch(text, /Shared Self/);
    if (search.trim().toLowerCase() === 'high-id') {
      assert.doesNotMatch(text, /Shared Low|Shared Tie/);
    } else {
      assert.ok(text.indexOf('Shared High') < text.indexOf('Shared Tie'));
      assert.ok(text.indexOf('Shared Tie') < text.indexOf('Shared Low'));
    }
  }
  assert.equal(reads, 1);
});

test('profile rating comes from reviews, not product count, and reports failures honestly', async () => {
  for (const summary of [{ avg: 4.8, count: 5 }, { avg: 0, count: 0 }, null]) {
    const harness = componentHarness(path.join('app', 'profile', 'page.tsx'), {
      '@/components/ProductPhotosPicker': { default: () => null },
      './account.module.css': { default: {} },
      '@/components/ProductSpecificationsFields': { default: () => null },
      '@/lib/product-details': { emptySpecifications: {} },
      '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'buyer' }, loading: false }) },
      '@/lib/firebase-service': {
        userService: { getUserProfile: async () => ({ name: 'Buyer', role: 'buyer' }) },
        productService: { getPostsByCreator: async () => Array.from({ length: 28 }, (_, i) => ({ id: String(i) })) },
      },
      '@/lib/realtime-sync': { listenToUserConnections: () => () => {} },
      '@/lib/firebase-reviews': {
        reviewService: {
          async getUserAverageRating(uid) {
            assert.equal(uid, 'buyer');
            if (!summary) throw new Error('permission-denied');
            return summary;
          },
        },
      },
    });
    harness.render();
    harness.effects[0]();
    harness.effects[1]();
    await new Promise(setImmediate);
    harness.setters[0]('reviews');
    const text = textContent(harness.render());
    if (!summary) {
      assert.match(text, /Unavailable/);
      assert.match(text, /Unable to load your rating/);
      assert.doesNotMatch(text, /4\.8|No reviews yet/);
    } else if (summary.count === 0) {
      assert.match(text, /No reviews/);
      assert.doesNotMatch(text, /4\.8/);
    } else {
      assert.match(text, /4\.8/);
      assert.match(text, /Based on 5 reviews/);
      assert.doesNotMatch(text, /Based on 28 products|No reviews yet/);
    }
  }
});

test('network permission failures render an error instead of zero-star users', async () => {
  const harness = componentHarness(path.join('app', 'network', 'page.tsx'), {
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'self' }, loading: false }) },
    '@/lib/firebase-service': { connectionService: {} },
    '@/lib/realtime-sync': { listenToAllUsers() {} },
    '@/lib/firebase-notifications': { notificationService: {} },
    '@/lib/firebase-reviews': {
      compareUserRatings,
      reviewService: { async getUserRatingSummaries() { throw new Error('permission-denied'); } },
    },
  });
  harness.render();
  harness.setters[6](false);
  harness.effects[1]();
  await new Promise(setImmediate);
  const text = textContent(harness.render());
  assert.match(text, /Unable to load user ratings/);
  assert.doesNotMatch(text, /No users available|0\.0/);
});

test('public profiles use the viewed user ID and show the real rating and review count', async () => {
  const harness = componentHarness(path.join('app', 'profile', '[userId]', 'page.tsx'), {
    './profile.module.css': { default: {} },
    'next/navigation': {
      useRouter: () => ({ push() {} }),
      useParams: () => ({ userId: 'viewed-user' }),
    },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'viewer' }, loading: false }) },
    '@/lib/firebase-service': {
      userService: { getUserProfile: async () => ({ name: 'Viewed Buyer', role: 'buyer' }) },
      productService: { getPostsByCreator: async () => [] },
      connectionService: { getUserConnectionRequests: async () => [] },
    },
    '@/lib/firebase-notifications': { notificationService: {} },
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    '@/lib/firebase-reviews': {
      reviewService: {
        async getUserAverageRating(uid) {
          assert.equal(uid, 'viewed-user');
          return { avg: 4.8, count: 5 };
        },
      },
    },
  });
  harness.render();
  harness.effects[0]();
  harness.effects[1]();
  await new Promise(setImmediate);
  const text = textContent(harness.render());
  assert.match(text, /4\.8 \(5 reviews\)/);
});

test('user listener uses document ID instead of missing or stale stored UID', () => {
  let users;
  const sync = loadModule(path.join('lib', 'realtime-sync.ts'), {
    './firebase': { db: {} },
    'firebase/firestore': {
      collection: (_, name) => name,
      onSnapshot: (_, callback) => {
        callback({ docs: [
          { id: 'canonical', data: () => ({ uid: 'stale', id: 'stale', name: 'Buyer' }) },
          { id: 'missing', data: () => ({ name: 'Supplier' }) },
        ] });
        return () => {};
      },
    },
  }, { window: {} });
  sync.listenToAllUsers((value) => { users = value; });
  assert.deepEqual(Array.from(users, (profile) => profile.uid), ['canonical', 'missing']);
  assert.equal(users[0].id, 'canonical');
});
const promotionDetails = {
  companyName: ' Acme Industrial ', brandName: ' Acme ', products: ' Bearings ',
  category: ' Industrial ', website: ' https://example.com ', country: ' UAE ',
  contactName: ' Test Contact ', email: ' test@example.com ', description: ' Promote our bearings. ',
};

function promotionService(user, addDoc) {
  return loadModule(path.join('lib', 'firebase-promotion-requests.ts'), {
    'firebase/firestore': {
      collection: (_, name) => name,
      serverTimestamp: () => 'server-timestamp',
      addDoc,
    },
    './firebase': { db: {}, auth: { currentUser: user } },
  }).submitPromotionRequest;
}

test('promotion requests save trimmed details with account ownership and pending status', async () => {
  let writes = 0;
  const submit = promotionService({ uid: 'requester' }, async (collection, data) => {
    assert.equal(collection, 'promotionRequests');
    assert.equal(data.userId, 'requester');
    assert.equal(data.status, 'PENDING');
    assert.equal(data.createdAt, 'server-timestamp');
    assert.equal(data.brandName, 'Acme');
    assert.equal(data.products, 'Bearings');
    assert.equal(data.email, 'test@example.com');
    assert.equal(data.companyName, 'Acme Industrial');
    writes += 1;
    return { id: 'saved-request' };
  });
  assert.equal(await submit(promotionDetails), 'saved-request');
  assert.equal(writes, 1);
});

test('promotion requests reject signed-out users and invalid form details without writing', async () => {
  const noWrite = async () => assert.fail('Invalid requests must not be written');
  await assert.rejects(promotionService(null, noWrite)(promotionDetails), /sign in/);
  const submit = promotionService({ uid: 'requester' }, noWrite);
  await assert.rejects(submit({ ...promotionDetails, products: ' ' }), /required fields/);
  await assert.rejects(submit({ ...promotionDetails, email: 'invalid' }), /valid business email/);
  await assert.rejects(submit({ ...promotionDetails, website: 'javascript:alert(1)' }), /https/);
  await assert.rejects(submit({ ...promotionDetails, description: 'x'.repeat(2001) }), /maximum length/);
});

test('promotion request write errors propagate instead of reporting a successful save', async () => {
  const error = new Error('permission-denied');
  const submit = promotionService({ uid: 'requester' }, async () => { throw error; });
  await assert.rejects(submit(promotionDetails), (cause) => cause === error);
});
