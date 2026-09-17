import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const emptyForm = { code: '', discount_pct: '', max_uses: '' }

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const generate = async e => {
    e.preventDefault()
    setMsg(null)
    const code = form.code.trim().toUpperCase()
    if (!code || !form.discount_pct || !form.max_uses) {
      setMsg({ ok: false, text: 'All fields are required.' })
      return
    }
    if (parseInt(form.discount_pct) < 1 || parseInt(form.discount_pct) > 100) {
      setMsg({ ok: false, text: 'Discount must be between 1 and 100.' })
      return
    }
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code,
      discount_pct: parseInt(form.discount_pct),
      max_uses:     parseInt(form.max_uses),
      used_count:   0,
      is_active:    true,
    })
    setSaving(false)
    if (error) {
      const isDupe = error.message.toLowerCase().includes('unique') || error.code === '23505'
      setMsg({ ok: false, text: isDupe ? `Code "${code}" already exists.` : error.message })
    } else {
      setMsg({ ok: true, text: `Coupon "${code}" created successfully!` })
      setForm(emptyForm)
      load()
    }
  }

  const toggleActive = async c => {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  const resetCount = async c => {
    await supabase.from('coupons').update({ used_count: 0 }).eq('id', c.id)
    load()
  }

  const deleteCoupon = async id => {
    if (!window.confirm('Delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    load()
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Generator Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <i className="fas fa-wand-magic-sparkles text-accent" />
          Generate New Coupon
        </h2>
        <p className="text-sm text-gray-400 mb-5">Set a custom code, discount percentage, and usage limit.</p>

        <form onSubmit={generate}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Coupon Code *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. BULK20"
                maxLength={20}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent tracking-widest uppercase font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Discount % *</label>
              <div className="relative">
                <input
                  type="number" min={1} max={100}
                  value={form.discount_pct}
                  onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
                  placeholder="20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-accent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Max Uses *</label>
              <input
                type="number" min={1}
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="50"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <i className="fas fa-spinner fa-spin" />
                : <i className="fas fa-plus" />}
              Generate Coupon
            </button>
            {msg && (
              <p className={`text-sm font-medium flex items-center gap-1.5
                ${msg.ok ? 'text-emerald-600' : 'text-accent'}`}>
                <i className={`fas fa-${msg.ok ? 'circle-check' : 'circle-xmark'}`} />
                {msg.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Coupons Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          All Coupons
          <span className="text-sm font-normal text-gray-400 ml-2">({coupons.length})</span>
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-16"><i className="fas fa-spinner fa-spin mr-2" />Loading…</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Discount', 'Used / Max', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(c => {
                  const exhausted = c.used_count >= c.max_uses
                  const pct = Math.min(100, Math.round((c.used_count / c.max_uses) * 100))
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-bold tracking-widest text-primary bg-gray-100 px-3 py-1 rounded-lg text-xs">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-red-50 text-accent text-xs font-bold px-3 py-1 rounded-full">
                          {c.discount_pct}% OFF
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 shrink-0">
                            <div
                              className={`h-1.5 rounded-full transition-all ${exhausted ? 'bg-red-400' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${exhausted ? 'text-red-500' : 'text-gray-600'}`}>
                            {c.used_count}/{c.max_uses}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleActive(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors
                            ${c.is_active && !exhausted
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : exhausted
                                ? 'bg-red-50 text-red-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                          {c.is_active && !exhausted ? 'Active' : exhausted ? 'Exhausted' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => resetCount(c)}
                            className="text-gray-300 hover:text-primary transition-colors text-xs flex items-center gap-1"
                            title="Reset usage count to 0"
                          >
                            <i className="fas fa-rotate-left" /> Reset
                          </button>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="text-gray-300 hover:text-accent transition-colors"
                            title="Delete coupon"
                          >
                            <i className="fas fa-trash text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {coupons.length === 0 && (
              <div className="text-center text-gray-400 py-12 text-sm">No coupons yet. Generate one above.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
