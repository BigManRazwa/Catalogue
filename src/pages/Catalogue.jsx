import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ProductGrid from '../components/ProductGrid'
import CartDrawer from '../components/CartDrawer'

export default function Catalogue() {
  const [filters, setFilters] = useState({
    category: 'All',
    priceMin: null,
    priceMax: null,
    sortBy: 'default',
    search: '',
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isListView, setIsListView] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCartClick={() => setIsCartOpen(true)}
        search={filters.search}
        onSearchChange={v => setFilters(f => ({ ...f, search: v }))}
      />
      <div className="max-w-screen-xl mx-auto flex gap-6 px-8 py-8">
        <Sidebar filters={filters} onFilterChange={setFilters} />
        <ProductGrid
          filters={filters}
          isListView={isListView}
          onViewToggle={setIsListView}
        />
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  )
}
