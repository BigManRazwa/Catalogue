import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from './ProductCard'
import { useCart } from '../context/CartContext'
import { LayoutGrid, List, PackageOpen, Loader2, AlertTriangle } from 'lucide-react'

export default function ProductGrid({ filters, isListView, onViewToggle, showReseller }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { pricingMode } = useCart()

  useEffect(() => {
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) { console.error(err); setError(err.message) }
        else setProducts(data || [])
        setLoading(false)
      })
  }, [])

  const getPrice = p => pricingMode === 'reseller' ? p.reseller_price : p.regular_price

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchCat    = filters.category === 'All' || p.category === filters.category
      const price       = getPrice(p)
      const matchMin    = filters.priceMin === null || price >= filters.priceMin
      const matchMax    = filters.priceMax === null || price <= filters.priceMax
      const matchSearch = !filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase())
      return matchCat && matchMin && matchMax && matchSearch
    })
    switch (filters.sortBy) {
      case 'price-asc':  list.sort((a, b) => getPrice(a) - getPrice(b)); break
      case 'price-desc': list.sort((a, b) => getPrice(b) - getPrice(a)); break
      case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc':  list.sort((a, b) => b.name.localeCompare(a.name)); break
      default: break
    }
    return list
  }, [products, filters, pricingMode])

  if (loading) return (
    <main className="flex-1 flex items-center justify-center h-64 text-gray-400 gap-3">
      <Loader2 className="w-6 h-6 animate-spin" /><span>Loading products…</span>
    </main>
  )

  if (error) return (
    <main className="flex-1 flex flex-col items-center justify-center h-64 gap-3">
      <AlertTriangle className="w-10 h-10 text-amber-400" />
      <p className="text-sm font-medium text-center text-gray-500">
        Could not load products.<br />
        <span className="text-xs text-gray-400">Check your Supabase env vars in .env.local</span>
      </p>
    </main>
  )

  return (
    <main className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-500">
          Showing <strong className="text-gray-900 font-semibold">{filtered.length}</strong> products
        </span>
        <div className="flex gap-2">
          <button onClick={() => onViewToggle(false)} title="Grid view"
            className={`p-2.5 rounded-lg border text-sm transition-all
              ${!isListView ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => onViewToggle(true)} title="List view"
            className={`p-2.5 rounded-lg border text-sm transition-all
              ${isListView ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <PackageOpen className="w-14 h-14 text-gray-200" />
          <p className="text-gray-400 text-sm">No products match your current filters.</p>
        </div>
      ) : (
        <div className={isListView ? 'flex flex-col gap-4' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'}>
          {filtered.map(p => <ProductCard key={p.id} product={p} isListView={isListView} showReseller={showReseller} />)}
        </div>
      )}
    </main>
  )
}
