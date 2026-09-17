import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, X, Minus, Plus, Trash2,
  Tag, CheckCircle, XCircle, Loader2, Info,
  ChevronDown, ChevronUp, Check, TicketPercent,
} from 'lucide-react'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function CartDrawer({ isOpen, onClose }) {
  const {
    items, pricingMode, setPricingMode, getPrice,
    removeItem, changeQty, clearCart,
    redeemedCoupons, couponAssignments,
    redeemCoupon, removeCoupon, toggleCouponItem, toggleCouponActive, isCouponActive, isEligible,
    subtotal, totalDiscount, discountBreakdown, total,
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [couponStatus, setCouponStatus] = useState(null)
  const [applying, setApplying] = useState(false)
  const [expandedCoupon, setExpandedCoupon] = useState(null)  // coupon id showing item picker
  const [detailCoupon, setDetailCoupon] = useState(null)      // coupon id showing description

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
      setCouponStatus({ ok: false, msg: 'Coupon has reached its usage limit.' })
    } else if (redeemedCoupons.find(c => c.id === data.id)) {
      setCouponStatus({ ok: false, msg: 'Coupon already redeemed.' })
    } else {
      // Increment used_count
      await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('id', data.id)
      redeemCoupon(data)
      setCouponStatus({ ok: true, msg: `"${data.code}" redeemed!` })
      setCouponInput('')
    }
    setApplying(false)
  }

  const getAssignedCount = couponId => (couponAssignments[couponId] || []).length

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-[400px] bg-white z-50 flex flex-col shadow-2xl
        transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-accent" /> Cart
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg p-1.5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Pricing mode ── */}
        <div className="px-6 py-3 border-b border-gray-100 shrink-0">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {[
              { value: 'regular', label: 'Regular' },
              { value: 'reseller', label: 'Reseller' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setPricingMode(value)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all
                  ${pricingMode === value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Cart items ── */}
          <div className="px-6 py-4 flex flex-col gap-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <ShoppingCart className="w-12 h-12 text-gray-200" />
                <p className="text-gray-400 text-sm text-center leading-relaxed">
                  Your cart is empty.<br />Add products to get started.
                </p>
              </div>
            ) : (
              items.map(({ product: p, qty }) => {
                const unitPrice = getPrice(p)
                const lineTotal = unitPrice * qty
                return (
                  <div key={p.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={p.image_url || 'https://picsum.photos/seed/default/400/400'} alt={p.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-2">{p.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{p.category}</p>
                      <p className="text-sm font-bold text-accent mt-1">{fmt(lineTotal)}</p>
                      {qty > 1 && <p className="text-xs text-gray-400">{fmt(unitPrice)} x {qty}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => changeQty(p.id, -1)}
                          className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{qty}</span>
                        <button onClick={() => changeQty(p.id, 1)}
                          className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(p.id)} className="text-gray-300 hover:text-red-500 transition-colors self-start mt-0.5 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* ── Coupons section ── */}
          {items.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <TicketPercent className="w-3.5 h-3.5" /> Coupons
              </h3>

              {/* Redeem input */}
              <div className="flex gap-2 mb-3">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Enter coupon code…"
                  maxLength={20}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent tracking-widest uppercase font-semibold"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applying || !couponInput.trim()}
                  className="bg-accent hover:bg-green-700 text-white rounded-lg px-4 text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-40 flex items-center gap-1"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                </button>
              </div>

              {couponStatus && (
                <p className={`text-xs font-medium flex items-center gap-1 mb-3 ${couponStatus.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponStatus.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {couponStatus.msg}
                </p>
              )}

              {/* Redeemed coupons list */}
              {redeemedCoupons.length > 0 && (
                <div className="flex flex-col gap-2">
                  {redeemedCoupons.map(coupon => {
                    const assigned = getAssignedCount(coupon.id)
                    const isUnlimited = !coupon.max_items || coupon.max_items === 0
                    const isExpanded = expandedCoupon === coupon.id
                    const showingDetail = detailCoupon === coupon.id

                    return (
                      <div key={coupon.id} className={`rounded-xl overflow-hidden border transition-all
                        ${isCouponActive(coupon.id)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                        {/* Coupon header */}
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <Tag className={`w-3.5 h-3.5 shrink-0 ${isCouponActive(coupon.id) ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold tracking-wider ${isCouponActive(coupon.id) ? 'text-green-800' : 'text-gray-500'}`}>{coupon.code}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                ${isCouponActive(coupon.id) ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{coupon.discount_pct}% OFF</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {coupon.min_price > 0 && (
                                <span className={`text-[10px] ${isCouponActive(coupon.id) ? 'text-green-600' : 'text-gray-400'}`}>Min {fmt(coupon.min_price)}</span>
                              )}
                              {!isUnlimited && (
                                <span className={`text-[10px] ${isCouponActive(coupon.id) ? 'text-green-600' : 'text-gray-400'}`}>
                                  {assigned}/{coupon.max_items} items
                                </span>
                              )}
                              {isUnlimited && isCouponActive(coupon.id) && assigned === 0 && (
                                <span className="text-[10px] text-green-600">Applies to all items</span>
                              )}
                              {!isCouponActive(coupon.id) && (
                                <span className="text-[10px] text-gray-400 italic">Saved for later</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {coupon.description && (
                              <button
                                onClick={() => setDetailCoupon(showingDetail ? null : coupon.id)}
                                title="Details"
                                className={`p-1 rounded transition-colors ${isCouponActive(coupon.id) ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isUnlimited && isCouponActive(coupon.id) && (
                              <button
                                onClick={() => setExpandedCoupon(isExpanded ? null : coupon.id)}
                                className="text-green-500 hover:text-green-700 p-1 rounded transition-colors"
                                title="Select items"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {/* Use / Save toggle */}
                            <button
                              onClick={() => toggleCouponActive(coupon.id)}
                              className={`ml-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
                                ${isCouponActive(coupon.id)
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-white border border-gray-300 text-gray-500 hover:border-accent hover:text-accent'}`}
                            >
                              {isCouponActive(coupon.id) ? 'Active' : 'Use'}
                            </button>
                          </div>
                        </div>

                        {/* Description detail */}
                        {showingDetail && coupon.description && (
                          <div className="px-3 pb-2.5 border-t border-green-100">
                            <p className="text-xs text-green-700 leading-relaxed pt-2">{coupon.description}</p>
                          </div>
                        )}

                        {/* Item picker (only for limited + active coupons) */}
                        {isExpanded && !isUnlimited && isCouponActive(coupon.id) && (
                          <div className="border-t border-green-100 px-3 py-2 flex flex-col gap-1">
                            <p className="text-[10px] text-green-600 font-semibold mb-1">
                              Select items ({assigned}/{coupon.max_items}):
                            </p>
                            {items.map(({ product: p, qty }) => {
                              const eligible = isEligible(coupon, p)
                              const isAssigned = (couponAssignments[coupon.id] || []).includes(p.id)
                              const atLimit = coupon.max_items > 0 && assigned >= coupon.max_items && !isAssigned

                              return (
                                <button
                                  key={p.id}
                                  onClick={() => eligible && !atLimit && toggleCouponItem(coupon.id, p.id)}
                                  disabled={!eligible || (atLimit && !isAssigned)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all w-full
                                    ${isAssigned
                                      ? 'bg-green-200/60 text-green-900'
                                      : eligible && !atLimit
                                        ? 'hover:bg-green-100 text-green-800'
                                        : 'opacity-40 cursor-not-allowed text-gray-400'}`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all
                                    ${isAssigned ? 'bg-green-600 border-green-600' : 'border-green-300'}`}>
                                    {isAssigned && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <img src={p.image_url || ''} className="w-6 h-6 rounded object-cover bg-gray-100 shrink-0" alt="" />
                                  <span className="flex-1 truncate font-medium">{p.name}</span>
                                  <span className="shrink-0 text-green-600">{fmt(getPrice(p))}</span>
                                  {!eligible && <span className="text-[9px] text-red-400 shrink-0">Below min</span>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Summary ── */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 flex flex-col gap-2.5 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{fmt(subtotal)}</span>
            </div>

            {discountBreakdown.map(({ coupon, amount }) => (
              <div key={coupon.id} className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {coupon.code}
                  <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{coupon.discount_pct}%</span>
                </span>
                <span>-{fmt(amount)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-base pt-2.5 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            <button onClick={clearCart}
              className="w-full mt-1 border-2 border-gray-200 hover:border-red-400 hover:text-red-500 text-gray-400 rounded-xl py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
