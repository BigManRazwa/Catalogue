import { useState, useEffect, useRef } from 'react'
import { Search, X, ShoppingCart, Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function Header({ onCartClick, search, onSearchChange, showReseller, onToggleReseller, isEndUser = true }) {
  const { totalItems } = useCart()
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 10)                  setVisible(true)
      else if (y < lastY.current)  setVisible(true)
      else                         setVisible(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50
        bg-green-50/90 backdrop-blur-md border-b border-green-100 shadow-sm
        transition-transform duration-300 ease-in-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <h1 className="text-lg font-bold text-green-900 shrink-0">Catalogue</h1>

        {/* Search — fills remaining space */}
        <div className="flex-1 flex items-center gap-2 bg-white/70 border border-green-200 rounded-lg px-3 py-2 focus-within:border-green-400 focus-within:bg-white transition-all">
          <Search className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-gray-700 text-sm w-full placeholder:text-gray-400"
            placeholder="Search products…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Reseller toggle — admin only */}
          {!isEndUser && (
            <button
              onClick={onToggleReseller}
              title={showReseller ? 'Hide reseller price' : 'Show reseller price'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${showReseller
                  ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                  : 'bg-white/50 border-green-100 text-green-400 hover:text-green-700 hover:bg-green-50'}`}
            >
              {showReseller ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Reseller</span>
            </button>
          )}

          {/* Admin button — admin only */}
          {!isEndUser && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 bg-white/60 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}

          {/* Divider */}
          {!isEndUser && <div className="w-px h-5 bg-green-200" />}

          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-green-700 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
