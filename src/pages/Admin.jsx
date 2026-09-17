import { useState } from 'react'
import ProductsTab from '../components/admin/ProductsTab'
import CouponsTab from '../components/admin/CouponsTab'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('products')

  const login = e => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setError('Incorrect password.')
      setPw('')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-white text-xl" />
            </div>
            <h2 className="text-xl font-bold">Admin Access</h2>
            <p className="text-sm text-gray-400 mt-1">Enter your password to continue</p>
          </div>
          <form onSubmit={login} className="flex flex-col gap-3">
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError('') }}
              placeholder="Password"
              autoFocus
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-accent w-full"
            />
            {error && <p className="text-accent text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-primary hover:bg-accent text-white font-semibold rounded-lg py-3 text-sm transition-colors"
            >
              Enter
            </button>
          </form>
          <p className="text-center mt-4">
            <a href="/" className="text-xs text-gray-400 hover:text-accent transition-colors">
              ← Back to Catalogue
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div>
          <h1 className="text-xl font-bold">⚙️ Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage products &amp; coupons</p>
        </div>
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <i className="fas fa-store" /> View Catalogue
          </a>
          <button
            onClick={() => setAuthed(false)}
            className="text-sm text-gray-400 hover:text-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-right-from-bracket" /> Logout
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 px-8">
        <div className="flex">
          {[
            { key: 'products', icon: 'fa-box',    label: 'Products' },
            { key: 'coupons',  icon: 'fa-ticket',  label: 'Coupons'  },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2
                ${activeTab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              <i className={`fas ${icon}`} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {activeTab === 'products' ? <ProductsTab /> : <CouponsTab />}
      </div>
    </div>
  )
}
