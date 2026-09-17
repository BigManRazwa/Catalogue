import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, ImageIcon, CloudUpload, Camera, Loader2, CheckCircle, XCircle, Package, GripVertical, ChevronRight, Tag, ShoppingCart } from 'lucide-react'
import ConfirmDialog from '../ConfirmDialog'

const MAX_IMAGES = 10
const emptyForm = { name:'', category:'', description:'', regular_price:'', reseller_price:'', badge:'', is_active:true }
const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function ProductsTab() {
  const [categories, setCategories]       = useState([])
  const [products, setProducts]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [modal, setModal]                 = useState(null)
  const [form, setForm]                   = useState(emptyForm)
  const [images, setImages]               = useState([])   // [{url, preview}]
  const [saving, setSaving]               = useState(false)
  const [msg, setMsg]                     = useState(null)
  const [uploading, setUploading]         = useState(false)
  const [confirm, setConfirm]             = useState(null)
  const [previewImg, setPreviewImg]       = useState(0)
  const fileRef = useRef()

  const load = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    ])
    setProducts(prodRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(emptyForm)
    setImages([])
    setPreviewImg(0)
    setMsg(null)
    setModal('new')
  }

  const openEdit = p => {
    setForm({
      ...p,
      regular_price: String(p.regular_price),
      reseller_price: String(p.reseller_price),
    })
    // Rebuild images from the product
    const imgs = []
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      p.images.forEach(url => imgs.push({ url, preview: url }))
    } else {
      if (p.image_url) imgs.push({ url: p.image_url, preview: p.image_url })
      if (p.hover_image_url) imgs.push({ url: p.hover_image_url, preview: p.hover_image_url })
    }
    setImages(imgs)
    setPreviewImg(0)
    setMsg(null)
    setModal(p)
  }

  const uploadImage = async file => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg({ ok: false, text: 'Please select an image file.' }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ ok: false, text: 'Image must be under 5MB.' }); return }
    if (images.length >= MAX_IMAGES) { setMsg({ ok: false, text: `Max ${MAX_IMAGES} images.` }); return }

    setUploading(true); setMsg(null)

    // Local preview
    const localPreview = URL.createObjectURL(file)

    const ext = file.name.split('.').pop()
    const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setMsg({ ok: false, text: 'Upload failed: ' + uploadError.message })
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
    setImages(prev => [...prev, { url: publicUrl, preview: localPreview }])
    setUploading(false)
  }

  const removeImage = idx => {
    setImages(prev => prev.filter((_, i) => i !== idx))
    if (previewImg >= images.length - 1) setPreviewImg(Math.max(0, images.length - 2))
  }

  const handleMultiFiles = files => {
    Array.from(files).slice(0, MAX_IMAGES - images.length).forEach(uploadImage)
  }

  const save = async () => {
    if (!form.name || !form.category || !form.regular_price || !form.reseller_price) {
      setMsg({ ok: false, text: 'Name, category, and both prices are required.' }); return
    }
    setSaving(true)
    const imgUrls = images.map(i => i.url)
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      regular_price: parseFloat(form.regular_price),
      reseller_price: parseFloat(form.reseller_price),
      image_url: imgUrls[0] || '',
      hover_image_url: imgUrls[1] || '',
      images: imgUrls,
      badge: form.badge,
      is_active: form.is_active,
    }
    const { error } = modal === 'new'
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', modal.id)
    setSaving(false)
    if (error) setMsg({ ok: false, text: error.message })
    else { setModal(null); load() }
  }

  const toggleActive = async p => { await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id); load() }
  const deleteProduct = id => { setConfirm({ id }) }
  const handleConfirmDelete = async () => { await supabase.from('products').delete().eq('id', confirm.id); setConfirm(null); load() }

  // Preview data for the live product detail
  const pImages = images.length > 0 ? images.map(i => i.preview || i.url) : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Products <span className="text-sm font-normal text-gray-400">({products.length})</span></h2>
        <button onClick={openNew} className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Product','Category','Regular','Reseller','Badge','Status',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0">
                        {p.image_url ? <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover bg-gray-100" alt="" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><ImageIcon className="w-4 h-4" /></div>}
                        {((p.images && p.images.length > 1) || p.hover_image_url) && (
                          <span className="absolute -bottom-1 -right-1 bg-accent text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                            {p.images ? p.images.length : 2}
                          </span>
                        )}
                      </div>
                      <div><p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                        {p.description && <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{p.description}</p>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.category}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">Rp {Number(p.regular_price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-reseller font-medium whitespace-nowrap">Rp {Number(p.reseller_price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">{p.badge && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${p.badge === 'new' ? 'bg-emerald-500' : 'bg-red-500'}`}>{p.badge}</span>}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(p)} className="text-gray-300 hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center text-gray-400 py-16 text-sm flex flex-col items-center gap-3">
              <Package className="w-10 h-10 opacity-20" /> No products yet.
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ── */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex overflow-hidden">

            {/* ── LEFT: Form ── */}
            <div className="w-[420px] shrink-0 overflow-y-auto p-6 border-r border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">{modal === 'new' ? 'Add New Product' : 'Edit Product'}</h3>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">

                {/* Multi-image upload */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Images <span className="font-normal text-gray-300 normal-case tracking-normal">({images.length}/{MAX_IMAGES})</span>
                  </label>

                  {/* Thumbnail strip */}
                  <div className="flex gap-2 flex-wrap mb-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 group shrink-0">
                        <img src={img.preview || img.url} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[8px] text-center font-bold py-0.5">Main</span>}
                        {i === 1 && <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] text-center font-bold py-0.5">Hover</span>}
                      </div>
                    ))}

                    {/* Add button */}
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        disabled={uploading}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleMultiFiles(e.dataTransfer.files) }}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-accent hover:bg-green-50 flex flex-col items-center justify-center text-gray-400 hover:text-accent transition-all shrink-0 disabled:opacity-50"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CloudUpload className="w-4 h-4" /><span className="text-[8px] mt-0.5">Add</span></>}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">1st = main, 2nd = hover. Drag to reorder. Max 5MB each.</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleMultiFiles(e.target.files)} />
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PVC Flex Banner Standard"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief product description, specs…" rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent resize-none" />
                </div>

                {/* Category + Badge */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent bg-white">
                      <option value="">Select…</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Badge</label>
                    <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent bg-white">
                      <option value="">None</option>
                      <option value="new">New</option>
                      <option value="sale">Sale</option>
                    </select>
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Regular (Rp) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input type="number" min={0} value={form.regular_price} onChange={e => setForm(f => ({ ...f, regular_price: e.target.value }))} placeholder="85000"
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Reseller (Rp) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input type="number" min={0} value={form.reseller_price} onChange={e => setForm(f => ({ ...f, reseller_price: e.target.value }))} placeholder="68000"
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent" />
                    </div>
                    {form.regular_price && form.reseller_price && parseFloat(form.regular_price) > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {Math.round((1 - parseFloat(form.reseller_price)/parseFloat(form.regular_price))*100)}% off regular
                      </p>
                    )}
                  </div>
                </div>

                {/* Visible toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visible</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${form.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className="text-xs text-gray-400">{form.is_active ? 'Visible' : 'Hidden'}</span>
                </div>
              </div>

              {msg && (
                <p className={`mt-4 text-sm font-medium flex items-center gap-2 ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {msg.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {msg.text}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setModal(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors">Cancel</button>
                <button onClick={save} disabled={saving || uploading}
                  className="px-5 py-2.5 bg-primary hover:bg-accent text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal === 'new' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* ── RIGHT: Live Preview (Product Detail Page) ── */}
            <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
              <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2 sticky top-0 z-10 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Product Page Preview</p>
              </div>

              <div className="p-6">
                {/* Breadcrumb preview */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-5">
                  <span>Home</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{form.category || 'Category'}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-600 font-medium truncate">{form.name || 'Product Name'}</span>
                </div>

                <div className="flex gap-6">
                  {/* Preview images */}
                  <div className="flex-1 min-w-0">
                    {/* Main image */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden aspect-square mb-3">
                      {pImages.length > 0 ? (
                        <img src={pImages[previewImg] || pImages[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ImageIcon className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {pImages.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {pImages.map((img, i) => (
                          <button key={i} onClick={() => setPreviewImg(i)}
                            className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all
                              ${previewImg === i ? 'border-accent' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview info */}
                  <div className="flex-1 min-w-0">
                    {form.badge && (
                      <span className={`inline-block text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-full mb-2
                        ${form.badge === 'new' ? 'bg-emerald-500' : 'bg-red-500'}`}>{form.badge}</span>
                    )}
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{form.category || 'Category'}</p>
                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-3">{form.name || 'Product Name'}</h3>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-bold text-gray-900">{fmt(parseFloat(form.regular_price) || 0)}</span>
                      <span className="text-[10px] text-gray-400">/m²</span>
                    </div>
                    {form.reseller_price && (
                      <p className="text-xs text-reseller flex items-center gap-1 font-medium mb-4">
                        <Tag className="w-3 h-3" /> Reseller: {fmt(parseFloat(form.reseller_price) || 0)}/m²
                      </p>
                    )}

                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] text-gray-500">Quantity</span>
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-1 py-0.5">
                          <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400"><span className="text-xs">−</span></div>
                          <span className="text-xs font-bold w-4 text-center">1</span>
                          <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400"><span className="text-xs">+</span></div>
                        </div>
                      </div>
                      <div className="bg-accent text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart — {fmt(parseFloat(form.regular_price) || 0)}
                      </div>
                    </div>

                    {form.description && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-[10px] font-bold text-gray-900 mb-1">Description</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap line-clamp-6">{form.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center mt-6">
                  Live preview updates as you fill in the form.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Product?"
        message="This product will be permanently removed. This cannot be undone."
        confirmLabel="Delete Product"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
