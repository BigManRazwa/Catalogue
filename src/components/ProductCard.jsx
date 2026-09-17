import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Tag, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function ProductCard({ product, isListView, showReseller }) {
  const { addItem, removeItem, changeQty, items, getPrice, pricingMode } = useCart()
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const inCart = items.find(i => i.product.id === product.id)
  const price = getPrice(product)
  const otherPrice = pricingMode === 'reseller' ? product.regular_price : product.reseller_price
  const otherLabel = pricingMode === 'reseller' ? 'Regular' : 'Reseller'

  const mainImg  = product.image_url || 'https://picsum.photos/seed/default/400/400'
  const hoverImg = product.hover_image_url || mainImg
  const displayImg = hovered && product.hover_image_url ? hoverImg : mainImg
  const isPreview = product.id === '__preview__'

  const handleCardClick = () => {
    if (!isPreview) navigate(`/product/${product.id}`)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden flex transition-all duration-200 hover:-translate-y-1 hover:shadow-md group
      ${isListView ? 'flex-row' : 'flex-col'}`}>

      {/* Image — clickable */}
      <div
        className={`relative overflow-hidden bg-gray-100 shrink-0 cursor-pointer ${isListView ? 'w-44 h-auto' : 'aspect-square'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleCardClick}
      >
        <img
          src={displayImg}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-500"
          loading="lazy"
        />
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide
            ${product.badge === 'new' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {product.badge}
          </span>
        )}
        {product.hover_image_url && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${!hovered ? 'bg-white' : 'bg-white/40'}`} />
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hovered ? 'bg-white' : 'bg-white/40'}`} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{product.category}</p>

        {/* Name — clickable */}
        <p onClick={handleCardClick}
          className={`text-sm font-semibold leading-snug text-gray-900 line-clamp-2 ${!isPreview ? 'cursor-pointer hover:text-accent transition-colors' : ''}`}>
          {product.name}
        </p>

        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        <div className="mt-2 flex flex-col gap-1">
          <p className="text-sm font-bold text-gray-900">
            {fmt(price)}<span className="text-xs font-normal text-gray-400"> /m²</span>
          </p>
          {showReseller && (
            <p className="text-xs text-reseller flex items-center gap-1 font-medium">
              <Tag className="w-3 h-3" />
              {otherLabel}: {fmt(otherPrice)}/m²
            </p>
          )}
        </div>

        {/* Cart button / qty controls */}
        {inCart ? (
          <div className="mt-auto pt-3 flex items-center gap-2">
            <button
              onClick={() => { if (inCart.qty <= 1) removeItem(product.id); else changeQty(product.id, -1) }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border
                ${inCart.qty <= 1
                  ? 'border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400'
                  : 'border-gray-200 text-gray-600 hover:bg-accent hover:border-accent hover:text-white'}`}
            >
              {inCart.qty <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <span className="flex-1 text-center text-sm font-bold">{inCart.qty}</span>
            <button
              onClick={() => changeQty(product.id, 1)}
              className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(product)}
            className="mt-auto pt-3 w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white rounded-lg py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
