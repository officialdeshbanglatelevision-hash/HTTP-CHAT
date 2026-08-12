import React, { useState } from 'react';
import { Calendar, Clock, MapPin, AlignLeft, X, Loader2 } from 'lucide-react';
import { EventDetails } from '../../types/chat';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (eventDetails: EventDetails) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    const details: EventDetails = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      location: location.trim(),
      rsvp: {},
    };

    onCreateEvent(details);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <Calendar className="w-5 h-5" />
            <span>Create Event</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-900 dark:text-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Team Sync & Coffee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Time
              </label>
              <div className="flex gap-1">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Google Meet or Physical Address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Description
            </label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <textarea
                rows={2}
                placeholder="Optional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-98 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Share Event in Chat</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
