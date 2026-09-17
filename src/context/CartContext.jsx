import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'

const CartContext = createContext()
export const useCart = () => useContext(CartContext)

const CART_KEY = 'catalogue_cart'

const loadStorage = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function CartProvider({ children }) {
  const saved = loadStorage()
  const [items, setItems]               = useState(saved?.items || [])
  const [pricingMode, setPricingMode]    = useState(saved?.pricingMode || 'regular')
  const [redeemedCoupons, setRedeemedCoupons] = useState(saved?.redeemedCoupons || [])
  const [couponAssignments, setCouponAssignments] = useState(saved?.couponAssignments || {})
  const [activeCoupons, setActiveCoupons] = useState(saved?.activeCoupons || []) // IDs of coupons currently "in use"

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify({
      items, pricingMode, redeemedCoupons, couponAssignments, activeCoupons,
    }))
  }, [items, pricingMode, redeemedCoupons, couponAssignments, activeCoupons])

  const getPrice = useCallback(product => {
    return pricingMode === 'reseller' ? product.reseller_price : product.regular_price
  }, [pricingMode])

  // ── Cart item ops ──
  const addItem = product => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  const removeItem = productId => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
    setCouponAssignments(prev => {
      const next = { ...prev }
      for (const cid in next) {
        next[cid] = next[cid].filter(pid => pid !== productId)
      }
      return next
    })
  }

  const changeQty = (productId, delta) => {
    setItems(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i
        const newQty = i.qty + delta
        return newQty <= 0 ? null : { ...i, qty: newQty }
      }).filter(Boolean)
    )
  }

  const clearCart = () => {
    setItems([])
    setRedeemedCoupons([])
    setCouponAssignments({})
    setActiveCoupons([])
    localStorage.removeItem(CART_KEY)
  }

  // ── Coupon ops ──
  const redeemCoupon = couponData => {
    if (redeemedCoupons.find(c => c.id === couponData.id)) return false
    setRedeemedCoupons(prev => [...prev, couponData])
    setCouponAssignments(prev => ({ ...prev, [couponData.id]: [] }))
    // Don't auto-activate — user decides when to use it
    return true
  }

  const removeCoupon = couponId => {
    setRedeemedCoupons(prev => prev.filter(c => c.id !== couponId))
    setCouponAssignments(prev => { const next = { ...prev }; delete next[couponId]; return next })
    setActiveCoupons(prev => prev.filter(id => id !== couponId))
  }

  const toggleCouponActive = couponId => {
    setActiveCoupons(prev => {
      if (prev.includes(couponId)) {
        // Deactivate
        return prev.filter(id => id !== couponId)
      } else {
        // Activate
        return [...prev, couponId]
      }
    })
  }

  const isCouponActive = couponId => activeCoupons.includes(couponId)

  const toggleCouponItem = (couponId, productId) => {
    const coupon = redeemedCoupons.find(c => c.id === couponId)
    if (!coupon) return
    setCouponAssignments(prev => {
      const current = prev[couponId] || []
      if (current.includes(productId)) {
        return { ...prev, [couponId]: current.filter(pid => pid !== productId) }
      } else {
        if (coupon.max_items > 0 && current.length >= coupon.max_items) return prev
        return { ...prev, [couponId]: [...current, productId] }
      }
    })
  }

  const isEligible = useCallback((coupon, product) => {
    if (!coupon.min_price || coupon.min_price <= 0) return true
    return getPrice(product) >= coupon.min_price
  }, [getPrice])

  // ── Computed values (NO STACKING — best single coupon per item) ──
  const computed = useMemo(() => {
    const subtotal = items.reduce((sum, { product, qty }) => sum + getPrice(product) * qty, 0)

    // Only consider ACTIVE coupons
    const active = redeemedCoupons.filter(c => activeCoupons.includes(c.id))

    // For each item, find the BEST coupon (highest discount) — no stacking
    // Track how much discount each coupon contributes
    const couponTotals = {} // { couponId: totalDiscountAmount }

    for (const { product, qty } of items) {
      const itemTotal = getPrice(product) * qty
      let bestCoupon = null
      let bestDiscount = 0

      for (const coupon of active) {
        const assignedIds = couponAssignments[coupon.id] || []
        const isUnlimited = !coupon.max_items || coupon.max_items === 0

        // Check if this coupon applies to this item
        let applies = false
        if (isUnlimited && assignedIds.length === 0) {
          // Unlimited coupon with no explicit assignments → applies to all eligible
          applies = isEligible(coupon, product)
        } else if (assignedIds.includes(product.id)) {
          applies = true
        }

        if (!applies) continue

        const discount = Math.round(itemTotal * coupon.discount_pct / 100)
        if (discount > bestDiscount) {
          bestDiscount = discount
          bestCoupon = coupon
        }
      }

      if (bestCoupon && bestDiscount > 0) {
        couponTotals[bestCoupon.id] = (couponTotals[bestCoupon.id] || 0) + bestDiscount
      }
    }

    const discountBreakdown = []
    let totalDiscount = 0
    for (const coupon of active) {
      const amount = couponTotals[coupon.id] || 0
      if (amount > 0) {
        discountBreakdown.push({ coupon, amount })
        totalDiscount += amount
      }
    }

    totalDiscount = Math.min(totalDiscount, subtotal)
    const total = subtotal - totalDiscount

    return {
      subtotal, totalDiscount, discountBreakdown, total,
      totalItems: items.reduce((sum, { qty }) => sum + qty, 0),
    }
  }, [items, pricingMode, redeemedCoupons, couponAssignments, activeCoupons, getPrice, isEligible])

  const value = {
    items, pricingMode, setPricingMode, getPrice,
    addItem, removeItem, changeQty, clearCart,
    redeemedCoupons, couponAssignments, activeCoupons,
    redeemCoupon, removeCoupon, toggleCouponItem, toggleCouponActive, isCouponActive, isEligible,
    ...computed,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
