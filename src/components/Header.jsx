import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function Header({ onCartClick, search, onSearchChange }) {
  const { totalItems } = useCart()

  return (
    <header className="sticky top-0 z-50 bg-primary text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto px-8 py-5 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-xl font-bold tracking-wide">🗂️ Sistem Display</h1>
          <p className="text-xs text-gray-400 mt-0.5">Product Catalogue — Price Calculator</p>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 w-64 focus-within:bg-white/20 transition-colors">
            <i className="fas fa-search text-white/40 text-sm shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/40"
              placeholder="Search products…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
            {search && (
              <button onClick={() => onSearchChange('')} className="text-white/40 hover:text-white transition-colors">
                <i className="fas fa-xmark text-xs" />
              </button>
            )}
          </div>

          {/* Admin link */}
          <Link
            to="/admin"
            className="text-white/50 hover:text-white text-sm transition-colors hidden md:block"
            title="Admin panel"
          >
            <i className="fas fa-gear" />
          </Link>

          {/* Cart button */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 bg-accent hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 shrink-0"
          >
            <i className="fas fa-shopping-cart" />
            <span className="hidden sm:inline">Price Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-accent text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
