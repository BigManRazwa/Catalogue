import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [pricingMode, setPricingMode] = useState('regular')
  const [coupon, setCoupon] = useState(null)

  const getPrice = useCallback((product) => {
    return pricingMode === 'reseller' ? product.reseller_price : product.regular_price
  }, [pricingMode])

  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const changeQty = useCallback((productId, delta) => {
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId
          ? { ...i, qty: Math.max(1, i.qty + delta) }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const totalItems = useMemo(() =>
    items.reduce((s, i) => s + i.qty, 0), [items])

  const subtotal = useMemo(() =>
    items.reduce((s, i) => s + getPrice(i.product) * i.qty, 0),
    [items, getPrice])

  const discountAmt = useMemo(() =>
    coupon ? Math.round(subtotal * coupon.discount_pct / 100) : 0,
    [coupon, subtotal])

  const total = subtotal - discountAmt

  return (
    <CartContext.Provider value={{
      items, pricingMode, setPricingMode,
      coupon, setCoupon,
      getPrice, addItem, removeItem, changeQty, clearCart,
      totalItems, subtotal, discountAmt, total,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
