'use client';

import { useEffect, useState } from 'react';
import { validateProductPhotos } from '@/lib/product-details';
import styles from './ProductShopping.module.css';

export default function ProductPhotosPicker({ files, onChange, existing = [], onRemoveExisting, disabled = false }: {
  files: File[];
  onChange: (files: File[]) => void;
  existing?: string[];
  onRemoveExisting?: (index: number) => void;
  disabled?: boolean;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  return <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: '12px 0', minWidth: 0 }}>
    <legend>Product photos ({existing.length + files.length}/10)</legend>
    <p>PNG, JPEG, WebP or GIF. Up to 10 photos, 50 MB each. The first photo is the cover.</p>
    {error && <p role="alert">{error}</p>}
    <label>Add product photos<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif"
      onChange={event => {
        const selected = Array.from(event.target.files || []);
        event.target.value = '';
        try {
          validateProductPhotos([...files, ...selected], existing.length);
          setError('');
          onChange([...files, ...selected]);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Unable to select photos.');
        }
      }} style={{ display: 'block', maxWidth: '100%', margin: '8px 0 12px' }} /></label>
    <div className={styles.photos}>
      {existing.map((url, index) => <div key={`${url}-${index}`}>
        <img src={url} alt={`Saved photo ${index + 1}`} />
        <button type="button" onClick={() => onRemoveExisting?.(index)}>Remove saved photo {index + 1}</button>
      </div>)}
      {previews.map((url, index) => <div key={url}>
        <img src={url} alt={`New photo ${index + 1}`} />
        <button type="button" onClick={() => onChange(files.filter((_, i) => i !== index))}>Remove new photo {index + 1}</button>
      </div>)}
    </div>
  </fieldset>;
}
