const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function render(imageUri) {
  const states = [0, false, false, []];
  let index = 0;
  const changes = [];
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: {
      useState: () => {
        const i = index++;
        return [states[i], value => { changes.push([i, value]); }];
      },
      useEffect() {},
      useRef: () => ({ current: null }),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useParams: () => ({ slug: 'product' }), useRouter: () => ({}) },
    'next/link': { default: 'a' },
    '@/lib/auth-context': { useAuth: () => ({ user: { uid: 'viewer' }, loading: false }) },
    '@/lib/firebase-service': {},
    '@/lib/firebase-messaging': {},
    '@/lib/firebase-wishlist': {},
    '@/lib/toast-context': { useToast: () => ({ addToast() {} }) },
    './ProductShopping.module.css': { default: { hero: 'hero' } },
  };
  const filename = path.join(__dirname, '..', 'components', 'ProductGallery.tsx');
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.length, 0);
  const exports = {};
  vm.runInNewContext(result.outputText, {
    exports,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; },
  });
  return { tree: exports.default({ images: imageUri ? [imageUri] : [], name: 'PNG bearing' }), changes };
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  return predicate(node) ? node : find(node.props?.children, predicate);
}

test('PNG filenames with parentheses, spaces and quotes render as image sources, not CSS', () => {
  for (const name of ['photo(1).png', 'photo%20(2).png', 'photo"test.png', "photo'test.png"]) {
    const url = `https://example.com/${name}?alt=media&token=example`;
    const { tree, changes } = render(url);
    const image = find(tree, n => n.type === 'img' && n.props.src === url);
    assert.ok(image);
    assert.equal(image.props.alt, 'PNG bearing');
    assert.equal(image.props.style.objectFit, 'contain');
    assert.equal(find(tree, n => Boolean(n.props?.style?.backgroundImage)), undefined);
    const container = find(tree, n => n.type === 'button' && n.props?.className === 'hero');
    container.props.onClick();
    assert.ok(changes.some(([index, value]) => index === 1 && value === true));
  }
});

test('listings without an image show a real empty state and cannot open a blank lightbox', () => {
  const { tree, changes } = render('');
  assert.ok(find(tree, n => n.props?.children === 'No image available'));
  assert.equal(find(tree, n => n.type === 'button'), undefined);
  assert.equal(changes.length, 0);
});
