import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-[fadeUp_.2s_ease]">

        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
