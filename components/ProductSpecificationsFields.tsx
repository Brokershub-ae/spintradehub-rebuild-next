import { PRODUCT_CONDITIONS, type ProductSpecifications } from '@/lib/product-details';
import styles from './ProductShopping.module.css';

export default function ProductSpecificationsFields({ value, onChange }: {
  value: ProductSpecifications;
  onChange: (value: ProductSpecifications) => void;
}) {
  return <div className={styles.fields}>
    <label>Brand (optional)<input maxLength={100} value={value.brand} onChange={e => onChange({ ...value, brand: e.target.value })} /></label>
    <label>Model / part number<input maxLength={100} value={value.modelNumber} onChange={e => onChange({ ...value, modelNumber: e.target.value })} /></label>
    <label>Condition<select value={value.condition} onChange={e => onChange({ ...value, condition: e.target.value })}>
      <option value="">Not specified</option>
      {PRODUCT_CONDITIONS.map(condition => <option key={condition}>{condition}</option>)}
    </select></label>
    <label>Minimum order quantity<input type="number" min="0.000001" step="any" value={value.minimumOrderQuantity}
      onChange={e => onChange({ ...value, minimumOrderQuantity: e.target.value })} /></label>
    <label>Minimum order unit<input maxLength={40} placeholder="e.g. pieces, kg, litres" value={value.minimumOrderUnit}
      onChange={e => onChange({ ...value, minimumOrderUnit: e.target.value })} /></label>
  </div>;
}
