import React from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Trash2, ShieldAlert, Flag, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type ConfirmationType = 'delete' | 'block' | 'report' | 'clear' | 'logout';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ConfirmationType;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const { showToast } = useTheme();

  const getModalConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: Trash2,
          iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
          title: 'Delete Chat',
          description: 'Are you sure you want to delete this conversation? This action cannot be undone.',
          confirmText: 'Delete',
          confirmBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'block':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
          title: 'Block Contact',
          description: 'Blocked contacts will no longer be able to call you or send you messages.',
          confirmText: 'Block',
          confirmBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'report':
        return {
          icon: Flag,
          iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
          title: 'Report Contact',
          description: 'The last 5 messages will be forwarded to HTTP CHAT for review. No fake data will be transmitted.',
          confirmText: 'Report',
          confirmBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'clear':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
          title: 'Clear Chat History',
          description: 'Are you sure you want to clear all messages in this conversation?',
          confirmText: 'Clear Chat',
          confirmBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'logout':
        return {
          icon: LogOut,
          iconBg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400',
          title: 'Log Out',
          description: 'Are you sure you want to log out of HTTP CHAT on this device?',
          confirmText: 'Log Out',
          confirmBg: 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white hover:bg-slate-800',
        };
    }
  };

  const config = getModalConfig();
  const Icon = config.icon;

  const handleConfirm = () => {
    onClose();
    showToast(`${config.title} confirmed (UI prototype execution)`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.iconBg}`}>
          <Icon className="w-7 h-7 stroke-[2]" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{config.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {config.description}
          </p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm ${config.confirmBg}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
