import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function CartDrawer({ isOpen, onClose }) {
  const {
    items, pricingMode, setPricingMode,
    coupon, setCoupon,
    getPrice, removeItem, changeQty, clearCart,
    subtotal, discountAmt, total,
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [couponStatus, setCouponStatus] = useState(null)
  const [applying, setApplying] = useState(false)

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setApplying(true)
    setCouponStatus(null)

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setCouponStatus({ ok: false, msg: 'Invalid coupon code.' })
    } else if (data.used_count >= data.max_uses) {
      setCouponStatus({ ok: false, msg: 'This coupon has reached its usage limit.' })
    } else {
      await supabase
        .from('coupons')
        .update({ used_count: data.used_count + 1 })
        .eq('id', data.id)

      setCoupon({ code: data.code, discount_pct: data.discount_pct })
      setCouponStatus({ ok: true, msg: `${data.discount_pct}% discount applied!` })
    }
    setApplying(false)
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponInput('')
    setCouponStatus(null)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-[360px] bg-white z-50 flex flex-col shadow-2xl
        transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-base flex items-center gap-2">
            <i className="fas fa-calculator text-accent" />
            Price Calculator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-accent hover:bg-gray-50 rounded-lg p-1.5 transition-all"
          >
            <i className="fas fa-xmark text-lg" />
          </button>
        </div>

        {/* Pricing Mode */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Pricing Mode</p>
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {[
              { value: 'regular',  label: 'Regular',  cls: 'text-gray-900' },
              { value: 'reseller', label: 'Reseller', cls: 'text-reseller' },
            ].map(({ value, label, cls }) => (
              <button
                key={value}
                onClick={() => setPricingMode(value)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-all
                  ${pricingMode === value
                    ? `bg-white shadow-sm ${cls}`
                    : 'text-gray-400 hover:text-gray-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div className="px-6 py-3 border-b border-gray-100 shrink-0">
          {coupon ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <span className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                <i className="fas fa-tag" />
                {coupon.code} — {coupon.discount_pct}% OFF
              </span>
              <button onClick={removeCoupon} className="text-emerald-400 hover:text-red-500 transition-colors">
                <i className="fas fa-xmark" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Coupon code…"
                  maxLength={20}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent tracking-widest uppercase"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applying || !couponInput.trim()}
                  className="bg-primary hover:bg-accent text-white rounded-lg px-4 text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-40"
                >
                  {applying
                    ? <i className="fas fa-spinner fa-spin" />
                    : 'Apply'}
                </button>
              </div>
              {couponStatus && (
                <p className={`text-xs mt-1.5 font-medium flex items-center gap-1
                  ${couponStatus.ok ? 'text-emerald-600' : 'text-accent'}`}>
                  <i className={`fas fa-${couponStatus.ok ? 'circle-check' : 'circle-xmark'}`} />
                  {couponStatus.msg}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
              <i className="fas fa-cart-shopping text-4xl" />
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Your cart is empty.<br />Add products to calculate price.
              </p>
            </div>
          ) : (
            items.map(({ product: p, qty }) => {
              const unitPrice  = getPrice(p)
              const lineTotal  = unitPrice * qty
              return (
                <div key={p.id} className="flex gap-3 bg-gray-50 rounded-xl p-3 group">
                  <img
                    src={p.image_url || 'https://picsum.photos/seed/default/400/400'}
                    alt={p.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{p.category}</p>
                    <p className="text-sm font-bold text-accent mt-1">{fmt(lineTotal)}</p>
                    {qty > 1 && (
                      <p className="text-xs text-gray-400">{fmt(unitPrice)} × {qty}</p>
                    )}
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      {[
                        { delta: -1, icon: 'minus' },
                        { delta: +1, icon: 'plus'  },
                      ].map(({ delta, icon }, idx) => (
                        <button
                          key={icon}
                          onClick={() => changeQty(p.id, delta)}
                          className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center text-[10px] hover:bg-accent hover:border-accent hover:text-white transition-all"
                          style={idx === 1 ? { order: 2 } : {}}
                        >
                          <i className={`fas fa-${icon}`} />
                        </button>
                      ))}
                      <span className="text-sm font-bold w-5 text-center" style={{ order: 1 }}>{qty}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(p.id)}
                    className="text-gray-300 hover:text-accent transition-colors self-start mt-0.5 shrink-0"
                  >
                    <i className="fas fa-trash-can text-sm" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{fmt(subtotal)}</span>
            </div>
            {coupon && discountAmt > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span className="flex items-center gap-2">
                  Discount
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {coupon.discount_pct}% OFF
                  </span>
                </span>
                <span>−{fmt(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            <button
              onClick={clearCart}
              className="w-full mt-1 border-2 border-gray-200 hover:border-accent hover:text-accent text-gray-400 rounded-xl py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-trash" /> Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
