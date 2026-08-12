import React from 'react';
import { Modal } from '../common/Modal';
import {
  Reply,
  Forward,
  Copy,
  Star,
  Trash2,
  CheckSquare,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ isOpen, onClose }) => {
  const { showToast } = useTheme();

  const options = [
    { id: 'reply', label: 'Reply', icon: Reply },
    { id: 'forward', label: 'Forward', icon: Forward },
    { id: 'copy', label: 'Copy Message', icon: Copy },
    { id: 'star', label: 'Star Message', icon: Star },
    { id: 'info', label: 'Message Info', icon: Info },
    { id: 'select', label: 'Select Messages', icon: CheckSquare },
    { id: 'delete', label: 'Delete Message', icon: Trash2, danger: true },
  ];

  const handleAction = (label: string) => {
    onClose();
    showToast(`${label} action triggered (UI prototype)`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Options">
      <div className="space-y-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => handleAction(opt.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                opt.danger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
