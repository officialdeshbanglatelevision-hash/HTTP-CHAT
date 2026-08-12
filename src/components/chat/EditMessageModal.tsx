import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ChatMessage } from '../../types/chat';
import { Edit3, Check } from 'lucide-react';

interface EditMessageModalProps {
  message: ChatMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (messageId: string, newText: string) => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (message) {
      setText(message.text);
    }
  }, [message]);

  const handleSave = () => {
    if (!message || !text.trim()) return;
    onSave(message.id, text.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Message">
      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Original message
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-accent"
            placeholder="Type message text..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || text.trim() === message?.text}
            className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Save Edits</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
