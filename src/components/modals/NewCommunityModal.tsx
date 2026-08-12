import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Users, Camera } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NewCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCommunityModal: React.FC<NewCommunityModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useTheme();
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    showToast(`Community "${communityName || 'Untitled'}" setup submitted (UI prototype)`);
    setCommunityName('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Community">
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors">
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Community Icon</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Community Name
          </label>
          <input
            type="text"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            placeholder="e.g. Neighborhood Watch, Marketing Dept"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Community Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this community for?"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 ring-accent resize-none"
          />
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
            Create Community
          </button>
        </div>
      </form>
    </Modal>
  );
};
