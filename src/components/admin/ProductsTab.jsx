import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  'Banner & Flex', 'Sticker & Vinyl', 'Backlit & Film',
  'Foam & Board', 'Display System', 'Canvas & Fabric', 'PVC & Rigid',
]

const emptyForm = {
  name: '', category: '', regular_price: '', reseller_price: '',
  image_url: '', badge: '', is_active: true,
}

export default function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null) // null | 'new' | product
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(emptyForm); setMsg(null); setModal('new') }
  const openEdit = p  => { setForm({ ...p, regular_price: String(p.regular_price), reseller_price: String(p.reseller_price) }); setMsg(null); setModal(p) }

  const save = async () => {
    if (!form.name || !form.category || !form.regular_price || !form.reseller_price) {
      setMsg({ ok: false, text: 'Name, category, and both prices are required.' })
      return
    }
    setSaving(true)
    const payload = {
      name:          form.name,
      category:      form.category,
      regular_price: parseFloat(form.regular_price),
      reseller_price:parseFloat(form.reseller_price),
      image_url:     form.image_url,
      badge:         form.badge,
      is_active:     form.is_active,
    }
    const { error } = modal === 'new'
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', modal.id)

    setSaving(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
    } else {
      setModal(null)
      load()
    }
  }

  const toggleActive = async p => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    load()
  }

  const deleteProduct = async id => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const field = (label, key, opts = {}) => (
    <div className={opts.col2 ? 'col-span-2' : ''} key={key}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">{label}</label>
      {opts.type === 'select' ? (
        <select
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent bg-white"
        >
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : opts.type === 'badge' ? (
        <select
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent bg-white"
        >
          <option value="">None</option>
          <option value="new">New</option>
          <option value="sale">Sale</option>
        </select>
      ) : (
        <input
          type={opts.type || 'text'}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Products <span className="text-sm font-normal text-gray-400">({products.length})</span></h2>
        <button
          onClick={openNew}
          className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16"><i className="fas fa-spinner fa-spin mr-2" />Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Category', 'Regular', 'Reseller', 'Badge', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || 'https://picsum.photos/seed/default/400/400'}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        alt=""
                      />
                      <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.category}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">Rp {Number(p.regular_price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-reseller font-medium whitespace-nowrap">Rp {Number(p.reseller_price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    {p.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white
                        ${p.badge === 'new' ? 'bg-emerald-500' : 'bg-accent'}`}>
                        {p.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors
                        ${p.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {p.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(p)} className="text-gray-300 hover:text-primary transition-colors" title="Edit">
                        <i className="fas fa-pencil" />
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-gray-300 hover:text-accent transition-colors" title="Delete">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center text-gray-400 py-12 text-sm">No products yet. Click "Add Product" to get started.</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">{modal === 'new' ? 'Add Product' : 'Edit Product'}</h3>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-xmark" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {field('Product Name *', 'name', { col2: true, placeholder: 'e.g. PVC Flex Banner Standard' })}
                {field('Category *', 'category', { type: 'select' })}
                {field('Badge', 'badge', { type: 'badge' })}
                {field('Regular Price (Rp) *', 'regular_price', { type: 'number', placeholder: '85000' })}
                {field('Reseller Price (Rp) *', 'reseller_price', { type: 'number', placeholder: '68000' })}
                {field('Image URL', 'image_url', { col2: true, placeholder: 'https://…' })}

                <div className="col-span-2 flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visible in Catalogue</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-10 h-6 rounded-full transition-colors relative shrink-0
                      ${form.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                      ${form.is_active ? 'left-5' : 'left-1'}`}
                    />
                  </button>
                </div>
              </div>

              {msg && (
                <p className={`mt-3 text-sm font-medium flex items-center gap-2
                  ${msg.ok ? 'text-emerald-600' : 'text-accent'}`}>
                  <i className={`fas fa-${msg.ok ? 'circle-check' : 'circle-xmark'}`} />
                  {msg.text}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary hover:bg-accent text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <i className="fas fa-spinner fa-spin" />}
                  {modal === 'new' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
