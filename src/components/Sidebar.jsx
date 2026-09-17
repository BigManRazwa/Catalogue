import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Sidebar({ filters, onFilterChange }) {
  const [categories, setCategories] = useState(['All'])
  const [localMin, setLocalMin] = useState('')
  const [localMax, setLocalMax] = useState('')

  useEffect(() => {
    supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const cats = ['All', ...new Set(data.map(p => p.category))]
          setCategories(cats)
        }
      })
  }, [])

  const applyPrice = () => {
    onFilterChange(f => ({
      ...f,
      priceMin: localMin ? parseInt(localMin) : null,
      priceMax: localMax ? parseInt(localMax) : null,
    }))
  }

  const reset = () => {
    setLocalMin('')
    setLocalMax('')
    onFilterChange({ category: 'All', priceMin: null, priceMax: null, sortBy: 'default', search: '' })
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col gap-4">

      {/* Category */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <i className="fas fa-tag" /> Category
        </h3>
        <ul className="flex flex-col gap-1">
          {categories.map(cat => (
            <li key={cat}>
              <button
                onClick={() => onFilterChange(f => ({ ...f, category: cat }))}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all
                  ${filters.category === cat
                    ? 'bg-red-50 text-accent font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {cat}
                {filters.category === cat && <i className="fas fa-check text-[10px]" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <i className="fas fa-tag" /> Price Range (Rp)
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            onChange={e => setLocalMin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            onChange={e => setLocalMax(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={applyPrice}
          className="w-full bg-primary hover:bg-accent text-white rounded-lg py-2 text-sm font-semibold transition-colors"
        >
          Apply
        </button>
        {(filters.priceMin !== null || filters.priceMax !== null) && (
          <p className="text-[10px] text-accent mt-2 text-center font-medium">
            Filter active: Rp{filters.priceMin?.toLocaleString('id-ID') || '0'} – Rp{filters.priceMax?.toLocaleString('id-ID') || '∞'}
          </p>
        )}
      </div>

      {/* Sort */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <i className="fas fa-sort" /> Sort By
        </h3>
        <select
          value={filters.sortBy}
          onChange={e => onFilterChange(f => ({ ...f, sortBy: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent bg-white cursor-pointer"
        >
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full border-2 border-gray-200 hover:border-accent hover:text-accent text-gray-400 rounded-xl py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
      >
        <i className="fas fa-rotate-left" /> Reset Filters
      </button>
    </aside>
  )
}
