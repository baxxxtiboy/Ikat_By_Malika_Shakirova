export function cleanProduct(b = {}) {
  const product = {
    name: String(b.name || '').trim().slice(0, 200),
    description: String(b.description || '').slice(0, 5000),
    category: String(b.category || '').trim().slice(0, 100),
    price: Math.max(0, Math.round(Number(b.price) || 0)),
    images: Array.isArray(b.images) ? b.images.filter((x) => typeof x === 'string').slice(0, 20) : [],
    is_active: b.is_active !== false,
  };
  const seen = new Set();
  const sizes = (Array.isArray(b.sizes) ? b.sizes : [])
    .map((s) => ({ size: String(s?.size || '').trim().slice(0, 20), stock: Math.max(0, parseInt(s?.stock, 10) || 0) }))
    .filter((s) => s.size && !seen.has(s.size) && seen.add(s.size));
  return { product, sizes };
}

export const PRODUCT_SELECT = '*, product_sizes(id,size,stock,sort)';
