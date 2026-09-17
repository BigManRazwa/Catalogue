import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, RotateCcw, Sparkles, Loader2, CheckCircle, XCircle, Info, Save, FolderOpen, Copy, Shuffle, X } from 'lucide-react'
import ConfirmDialog from '../ConfirmDialog'

const emptyForm = { code: '', discount_pct: '', max_uses: '', description: '', min_price: '', max_items: '', qty: '1' }
const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')
const PRESET_KEY = 'coupon_presets'

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [presets, setPresets]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRESET_KEY)) || [] }
    catch { return [] }
  })
  const [presetName, setPresetName] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const savePresets = list => { setPresets(list); localStorage.setItem(PRESET_KEY, JSON.stringify(list)) }

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const savePreset = () => {
    const name = presetName.trim()
    if (!name) return
    const preset = {
      id: Date.now(),
      name,
      discount_pct: form.discount_pct,
      max_uses: form.max_uses,
      description: form.description,
      min_price: form.min_price,
      max_items: form.max_items,
    }
    savePresets([preset, ...presets])
    setPresetName('')
    setMsg({ ok: true, text: `Preset "${name}" saved!` })
  }

  const loadPreset = preset => {
    setForm(f => ({
      ...f,
      discount_pct: preset.discount_pct || '',
      max_uses: preset.max_uses || '',
      description: preset.description || '',
      min_price: preset.min_price || '',
      max_items: preset.max_items || '',
    }))
    setShowPresets(false)
    setMsg({ ok: true, text: `Loaded preset "${preset.name}"` })
  }

  const deletePreset = id => { savePresets(presets.filter(p => p.id !== id)) }

  const generate = async e => {
    e.preventDefault(); setMsg(null)
    if (!form.discount_pct || !form.max_uses) { setMsg({ ok: false, text: 'Discount % and max uses are required.' }); return }
    if (parseInt(form.discount_pct) < 1 || parseInt(form.discount_pct) > 100) { setMsg({ ok: false, text: 'Discount must be between 1 and 100.' }); return }

    const qty = Math.max(1, Math.min(100, parseInt(form.qty) || 1))
    setSaving(true)

    const payloads = []
    const generatedCodes = []
    for (let i = 0; i < qty; i++) {
      const code = qty === 1 && form.code.trim()
        ? form.code.trim().toUpperCase()
        : genCode()
      generatedCodes.push(code)
      payloads.push({
        code,
        discount_pct: parseInt(form.discount_pct),
        max_uses: parseInt(form.max_uses),
        used_count: 0,
        is_active: true,
        description: form.description.trim(),
        min_price: form.min_price ? parseFloat(form.min_price) : 0,
        max_items: form.max_items ? parseInt(form.max_items) : 0,
      })
    }

    const { error } = await supabase.from('coupons').insert(payloads)
    setSaving(false)
    if (error) {
      const isDupe = error.message.toLowerCase().includes('unique') || error.code === '23505'
      setMsg({ ok: false, text: isDupe ? 'A generated code already exists. Try again.' : error.message })
    } else {
      if (qty === 1) {
        setMsg({ ok: true, text: `Coupon "${generatedCodes[0]}" created!` })
      } else {
        setMsg({ ok: true, text: `${qty} coupons generated!` })
      }
      setForm(f => ({ ...f, code: '', qty: '1' }))
      load()
    }
  }

  const toggleActive = async c => { await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id); load() }
  const resetCount   = async c => { await supabase.from('coupons').update({ used_count: 0 }).eq('id', c.id); load() }
  const deleteCoupon = id => { setConfirm({ id }) }
  const handleConfirmDelete = async () => {
    await supabase.from('coupons').delete().eq('id', confirm.id)
    setConfirm(null)
    load()
  }

   return (
    <div className="flex flex-col gap-8">
      {/* Presets bar */}
      {presets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" /> Saved Presets
          </h3>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <div key={p.id} className="group flex items-center gap-2 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-lg pl-3 pr-1.5 py-2 transition-all cursor-pointer">
                <button onClick={() => loadPreset(p)} className="text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-green-800 transition-colors">{p.name}</p>
                  <p className="text-[10px] text-gray-400 group-hover:text-green-600 transition-colors">
                    {p.discount_pct}% off · {p.max_uses} uses
                    {p.min_price && parseInt(p.min_price) > 0 ? ` · Min ${fmt(parseInt(p.min_price))}` : ''}
                    {p.max_items && parseInt(p.max_items) > 0 ? ` · ${p.max_items} items` : ''}
                  </p>
                </button>
                <button onClick={() => deletePreset(p.id)}
                  className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generator */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-accent" /> Generate Coupons
        </h2>
        <p className="text-sm text-gray-400 mb-5">Leave code blank to auto-generate. Set qty &gt; 1 for bulk.</p>

        <form onSubmit={generate}>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Row 1 */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Code <span className="font-normal text-gray-300 normal-case tracking-normal">(auto if blank)</span></label>
              <div className="relative">
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="AUTO" maxLength={20}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-accent tracking-widest uppercase font-semibold" />
                <button type="button" onClick={() => setForm(f => ({ ...f, code: genCode() }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-accent transition-colors" title="Random code">
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Discount % *</label>
              <div className="relative">
                <input type="number" min={1} max={100} value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
                  placeholder="20" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-accent" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Max Uses *</label>
              <input type="number" min={1} value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="50" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Quantity
                <span className="ml-1 font-normal text-gray-300 normal-case tracking-normal">to generate</span>
              </label>
              <input type="number" min={1} max={100} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                placeholder="1" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent" />
            </div>

            {/* Row 2: limits */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Min Price (Rp)
                <span className="ml-1 font-normal text-gray-300 normal-case tracking-normal">0 = none</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                <input type="number" min={0} value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))}
                  placeholder="0" className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Max Items
                <span className="ml-1 font-normal text-gray-300 normal-case tracking-normal">0 = all</span>
              </label>
              <input type="number" min={0} value={form.max_items} onChange={e => setForm(f => ({ ...f, max_items: e.target.value }))}
                placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div className="col-span-2 flex items-end pb-0.5">
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-400 leading-relaxed w-full">
                <Info className="w-3 h-3 inline mr-1" />
                {form.min_price && parseInt(form.min_price) > 0
                  ? `Items ≥ ${fmt(parseInt(form.min_price))}`
                  : 'No price limit'}
                {' · '}
                {form.max_items && parseInt(form.max_items) > 0
                  ? `Up to ${form.max_items} item${parseInt(form.max_items) > 1 ? 's' : ''}`
                  : 'All items'}
                {parseInt(form.qty) > 1
                  ? ` · ${form.qty} codes (auto-generated)`
                  : ''}
              </div>
            </div>

            {/* Row 3: description */}
            <div className="col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Description
                <span className="ml-1 font-normal text-gray-300 normal-case tracking-normal">shown to users</span>
              </label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Get 20% off on premium banners! Valid until end of month."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent resize-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" disabled={saving}
              className="bg-accent hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {parseInt(form.qty) > 1 ? `Generate ${form.qty} Coupons` : 'Generate Coupon'}
            </button>

            {/* Save as preset */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1">
              <input value={presetName} onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), savePreset())}
                placeholder="Preset name…"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent w-36" />
              <button type="button" onClick={savePreset} disabled={!presetName.trim()}
                className="text-gray-400 hover:text-accent disabled:opacity-30 transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
                title="Save current settings as preset">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>

            {msg && (
              <p className={`text-sm font-medium flex items-center gap-1.5 ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {msg.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {msg.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Coupons <span className="text-sm font-normal text-gray-400">({coupons.length})</span></h2>
        {loading ? (
          <div className="text-center text-gray-400 py-16 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Code','Discount','Limits','Used / Max','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(c => {
                  const exhausted = c.used_count >= c.max_uses
                  const pct = Math.min(100, Math.round((c.used_count / c.max_uses) * 100))
                  const hasLimits = (c.min_price && c.min_price > 0) || (c.max_items && c.max_items > 0)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-widest text-primary bg-gray-100 px-3 py-1 rounded-lg text-xs">{c.code}</span>
                          <button onClick={() => { navigator.clipboard.writeText(c.code) }}
                            className="text-gray-300 hover:text-accent transition-colors" title="Copy code">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 max-w-[180px]">{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-4"><span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">{c.discount_pct}% OFF</span></td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {hasLimits ? (
                          <div className="flex flex-col gap-0.5">
                            {c.min_price > 0 && <span>Min {fmt(c.min_price)}</span>}
                            {c.max_items > 0 && <span>Max {c.max_items} item{c.max_items > 1 ? 's' : ''}</span>}
                          </div>
                        ) : (
                          <span className="text-gray-300">No limits</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 shrink-0">
                            <div className={`h-1.5 rounded-full ${exhausted ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${exhausted ? 'text-red-500' : 'text-gray-600'}`}>{c.used_count}/{c.max_uses}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleActive(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors
                            ${c.is_active && !exhausted ? 'bg-emerald-100 text-emerald-700' : exhausted ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                          {c.is_active && !exhausted ? 'Active' : exhausted ? 'Exhausted' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <button onClick={() => resetCount(c)} className="text-gray-300 hover:text-primary transition-colors flex items-center gap-1 text-xs" title="Reset usage">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                          </button>
                          <button onClick={() => deleteCoupon(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {coupons.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No coupons yet. Generate one above.</div>}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Coupon?"
        message="This coupon code will be permanently deleted and can no longer be used."
        confirmLabel="Delete Coupon"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
