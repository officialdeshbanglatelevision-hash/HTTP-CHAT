import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Users, Camera } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useTheme();
  const [groupName, setGroupName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    showToast(`New group "${groupName || 'Untitled'}" form submitted (UI prototype)`);
    setGroupName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group">
      <form onSubmit={handleCreate} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors">
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Add Photo</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Type group subject here..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 ring-accent"
          />
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Participants</p>
          <p>No contacts available to add. Adding participants requires backend connection.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium text-sm transition-colors shadow-sm accent-glow hover:brightness-105"
          >
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
};
