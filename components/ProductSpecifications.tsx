import type { Product } from '@/lib/firebase-service';
import styles from './ProductShopping.module.css';

export default function ProductSpecifications({ product }: { product: Partial<Product> }) {
  const values = [
    ['Brand', product.brand],
    ['Model / part number', product.modelNumber],
    ['Condition', product.condition],
    ['Minimum order', product.minimumOrderQuantity ? `${product.minimumOrderQuantity} ${product.minimumOrderUnit || ''}`.trim() : ''],
  ].filter(([, value]) => value);
  return <div>
    <p><strong>{product.price?.trim() || 'Request price'}</strong></p>
    {values.length > 0 && <dl className={styles.specifications}>{values.map(([label, value]) =>
      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
    )}</dl>}
    {product.pdfUri && <a href={product.pdfUri} target="_blank" rel="noopener noreferrer">View product datasheet / catalogue (PDF)</a>}
  </div>;
}
