import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, GripVertical, Check, X, Loader2, FolderOpen } from 'lucide-react'
import ConfirmDialog from '../ConfirmDialog'

export default function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [newName, setNewName]       = useState('')
  const [editId, setEditId]         = useState(null)
  const [editName, setEditName]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState(null)
  const [confirm, setConfirm]       = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addCategory = async e => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true); setMsg(null)
    const maxOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order || 0)) + 1
      : 1
    const { error } = await supabase.from('categories').insert({ name, sort_order: maxOrder })
    setSaving(false)
    if (error) {
      const isDupe = error.message.toLowerCase().includes('unique') || error.code === '23505'
      setMsg({ ok: false, text: isDupe ? `"${name}" already exists.` : error.message })
    } else {
      setMsg({ ok: true, text: `"${name}" added!` })
      setNewName('')
      load()
    }
  }

  const startEdit = cat => {
    setEditId(cat.id)
    setEditName(cat.name)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditName('')
  }

  const saveEdit = async () => {
    const name = editName.trim()
    if (!name) return

    // Also update all products that had the old category name
    const oldCat = categories.find(c => c.id === editId)
    const { error } = await supabase.from('categories').update({ name }).eq('id', editId)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }

    // Rename the category on existing products
    if (oldCat && oldCat.name !== name) {
      await supabase.from('products').update({ category: name }).eq('category', oldCat.name)
    }

    setEditId(null)
    setEditName('')
    setMsg({ ok: true, text: 'Category renamed.' })
    load()
  }

  const deleteCategory = id => { setConfirm({ id }) }
  const handleConfirmDelete = async () => {
    const cat = categories.find(c => c.id === confirm.id)
    await supabase.from('categories').delete().eq('id', confirm.id)
    // Uncategorise products that used this
    if (cat) {
      await supabase.from('products').update({ category: 'Uncategorised' }).eq('category', cat.name)
    }
    setConfirm(null)
    load()
  }

  const moveUp = async (cat, idx) => {
    if (idx === 0) return
    const prev = categories[idx - 1]
    await supabase.from('categories').update({ sort_order: prev.sort_order }).eq('id', cat.id)
    await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', prev.id)
    load()
  }

  const moveDown = async (cat, idx) => {
    if (idx === categories.length - 1) return
    const next = categories[idx + 1]
    await supabase.from('categories').update({ sort_order: next.sort_order }).eq('id', cat.id)
    await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', next.id)
    load()
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Add category */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-accent" /> Add Category
        </h2>
        <p className="text-sm text-gray-400 mb-4">Categories are shared across all products.</p>
        <form onSubmit={addCategory} className="flex gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Wide Format Paper"
            maxLength={50}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="bg-accent hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
        {msg && (
          <p className={`text-sm font-medium flex items-center gap-1.5 mt-3 ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {msg.text}
          </p>
        )}
      </div>

      {/* List */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          All Categories <span className="text-sm font-normal text-gray-400">({categories.length})</span>
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-16 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center text-gray-400 py-16 text-sm flex flex-col items-center gap-3">
            <FolderOpen className="w-10 h-10 opacity-20" /> No categories yet. Add one above.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">

                {/* Reorder arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(cat, idx)}
                    disabled={idx === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors text-xs"
                  >▲</button>
                  <button
                    onClick={() => moveDown(cat, idx)}
                    disabled={idx === categories.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors text-xs"
                  >▼</button>
                </div>

                {/* Name or edit input */}
                <div className="flex-1 min-w-0">
                  {editId === cat.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      autoFocus
                      className="w-full border border-accent rounded-lg px-3 py-1.5 text-sm outline-none"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                  )}
                </div>

                {/* Order badge */}
                <span className="text-[10px] text-gray-300 font-mono shrink-0">#{idx + 1}</span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {editId === cat.id ? (
                    <>
                      <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-700 transition-colors" title="Save">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors" title="Cancel">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cat)} className="text-gray-300 hover:text-primary transition-colors" title="Rename">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Category?"
        message="Products using this category will be moved to 'Uncategorised'. This cannot be undone."
        confirmLabel="Delete Category"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
