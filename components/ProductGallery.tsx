'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProductShopping.module.css';

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = Math.min(selected, Math.max(0, images.length - 1));
  const image = images[current];

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const move = (offset: number) => {
    setSelected((current + offset + images.length) % images.length);
    setZoomed(false);
  };
  const photo = (inDialog = false) => failed.includes(image) ? <p role="alert">This photo could not load. Try another photo or refresh the page.</p> :
    <img src={image} alt={name} onError={() => setFailed(previous => [...previous, image])}
      style={inDialog ? undefined : { width: '100%', height: '100%', objectFit: 'contain' }} />;

  if (!image) return <div style={{ height: 200, display: 'grid', placeItems: 'center', background: '#f1f5f9' }}>No image available</div>;
  return <div>
    <button type="button" className={styles.hero} aria-label={`Enlarge ${name}`} onClick={() => { setOpen(true); setZoomed(false); }}>
      {photo()}
    </button>
    <p style={{ textAlign: 'center', margin: 8 }}>Photo {current + 1} of {images.length} - tap to enlarge</p>
    {images.length > 1 && <div className={styles.thumbnails} aria-label="Product photos">
      {images.map((url, index) => <button type="button" key={url} aria-label={`Show photo ${index + 1}`}
        aria-pressed={current === index} onClick={() => { setSelected(index); setZoomed(false); }}>
        <img src={url} alt={`Thumbnail ${index + 1}`} />
      </button>)}
    </div>}
    <dialog ref={dialog} className={styles.dialog} aria-label={`${name} photo viewer`}
      onClose={() => setOpen(false)} onCancel={() => setOpen(false)}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}>
      {open && <>
        <div className={styles.toolbar}>
          <button type="button" disabled={images.length < 2} onClick={() => move(-1)}>Previous photo</button>
          <span>{current + 1} / {images.length}</span>
          <button type="button" disabled={images.length < 2} onClick={() => move(1)}>Next photo</button>
          <button type="button" onClick={() => setZoomed(!zoomed)}>{zoomed ? 'Zoom out' : 'Zoom in'}</button>
          <button type="button" onClick={() => setOpen(false)}>Close photos</button>
        </div>
        <div className={styles.zoomArea} data-zoomed={zoomed}>{photo(true)}</div>
      </>}
    </dialog>
  </div>;
}
