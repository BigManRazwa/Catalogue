import { useCart } from '../context/CartContext'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function ProductCard({ product, isListView }) {
  const { addItem, items, getPrice, pricingMode } = useCart()
  const inCart = items.find(i => i.product.id === product.id)
  const price = getPrice(product)
  const otherPrice = pricingMode === 'reseller' ? product.regular_price : product.reseller_price
  const otherLabel = pricingMode === 'reseller' ? 'Regular' : 'Reseller'

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden flex transition-all duration-200 hover:-translate-y-1 hover:shadow-md group
        ${isListView ? 'flex-row' : 'flex-col'}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-gray-100 shrink-0
        ${isListView ? 'w-44 h-auto' : 'aspect-square'}`}>
        <img
          src={product.image_url || 'https://picsum.photos/seed/default/400/400'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide
            ${product.badge === 'new' ? 'bg-emerald-500' : 'bg-accent'}`}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{product.category}</p>
        <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2">{product.name}</p>

        <div className="mt-2 flex flex-col gap-1">
          <p className="text-sm font-bold text-gray-900">
            {fmt(price)}
            <span className="text-xs font-normal text-gray-400"> /m²</span>
          </p>
          <p className="text-xs text-reseller flex items-center gap-1 font-medium">
            <i className="fas fa-tag text-[10px]" />
            {otherLabel}: {fmt(otherPrice)}/m²
          </p>
        </div>

        <button
          onClick={() => addItem(product)}
          className={`mt-auto pt-3 w-full flex items-center justify-center gap-2 text-white rounded-lg py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0
            ${inCart
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-primary hover:bg-accent'}`}
        >
          <i className={`fas fa-${inCart ? 'check' : 'cart-plus'} text-xs`} />
          {inCart ? `In Cart (${inCart.qty}x)` : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
