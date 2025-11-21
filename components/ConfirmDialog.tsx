
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in ring-1 ring-white/10">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors border border-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-lg shadow-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
