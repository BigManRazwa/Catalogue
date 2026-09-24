import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import CartDrawer from '../components/CartDrawer'
import { ChevronRight, Minus, Plus, ShoppingCart, Check, Loader2, ArrowLeft } from 'lucide-react'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)
  const { addItem, items, getPrice, pricingMode } = useCart()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  )

  if (!product) return (
    <div className="min-h-screen bg-gray-50 pt-16 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-lg font-medium">Product not found</p>
      <Link to="/" className="text-accent hover:underline text-sm flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </Link>
    </div>
  )

  let allImages = []
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    allImages = product.images
  } else {
    if (product.image_url) allImages.push(product.image_url)
    if (product.hover_image_url) allImages.push(product.hover_image_url)
  }
  if (allImages.length === 0) allImages = ['https://picsum.photos/seed/default/600/600']

  const inCart = items.find(i => i.product.id === product.id)
  const price = getPrice(product)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header
        onCartClick={() => setCartOpen(true)}
        search=""
        onSearchChange={() => {}}
        showReseller={false}
        onToggleReseller={() => {}}
        isEndUser={true}
      />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} isEndUser={true} />

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* Back + Breadcrumb row */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-accent transition-colors flex items-center gap-1.5 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
            <Link to="/" className="hover:text-accent transition-colors shrink-0">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-gray-700 font-medium truncate">{product.name}</span>
          </nav>
        </div>

        <div className="flex gap-10 items-start">

          {/* Left: Images */}
          <div className="flex-1 max-w-xl">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden aspect-square mb-4">
              <img
                src={allImages[selectedImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all
                      ${selectedImg === i
                        ? 'border-accent shadow-md'
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex-1 max-w-md">
            {product.badge && (
              <span className={`inline-block text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wide mb-3
                ${product.badge === 'new' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {product.badge}
              </span>
            )}

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{product.category}</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-3xl font-bold text-gray-900">{fmt(price)}</span>
              <span className="text-sm text-gray-400">/m²</span>
            </div>

            <div className="border-t border-gray-100 pt-6 mb-6">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm text-gray-500 font-medium w-20">Quantity</span>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-1 py-1">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-bold w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className={`w-full flex items-center justify-center gap-3 text-white rounded-xl py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5 shadow-md
                  ${inCart ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-accent hover:bg-green-700'}`}
              >
                {inCart ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {inCart ? `In Cart (${inCart.qty}x) — Add ${qty} more` : `Add to Cart — ${fmt(price * qty)}`}
              </button>
            </div>

            {product.description && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
