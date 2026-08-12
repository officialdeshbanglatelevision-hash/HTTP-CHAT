import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Check, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useTheme();
  const [selectedLang, setSelectedLang] = useState('English');

  const languages = [
    { code: 'en', name: 'English', native: 'English (US)' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'zh', name: 'Chinese', native: '中文 (简体)' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ];

  const handleSelect = (langName: string) => {
    setSelectedLang(langName);
    onClose();
    showToast(`App language updated to ${langName} (UI prototype)`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="App Language">
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {languages.map((lang) => {
          const isSelected = selectedLang === lang.name;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>{lang.native}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
