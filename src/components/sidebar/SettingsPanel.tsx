'use client';

import { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { relays, addRelay, removeRelay } = useSettingsStore();
  const [newRelay, setNewRelay] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleAddRelay = () => {
    const trimmed = newRelay.trim();
    if (trimmed && trimmed.startsWith('wss://')) {
      addRelay(trimmed);
      setNewRelay('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRelay();
    }
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="sticky top-0 w-72 h-screen border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Settings
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Close panel"
          aria-label="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Relays
            </h3>
            <ul className="space-y-1">
              {relays.map((relay) => (
                <li
                  key={relay}
                  className="flex items-center justify-between gap-2 p-2 bg-zinc-200 dark:bg-zinc-800 rounded text-xs"
                >
                  <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">
                    {relay}
                  </span>
                  <button
                    onClick={() => removeRelay(relay)}
                    className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                    title="Remove relay"
                    aria-label="Remove relay"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-2">
              Add Relay
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="wss://relay.example.com"
                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoComplete="url"
              />
              <Button
                size="sm"
                onClick={handleAddRelay}
                disabled={!newRelay.trim() || !newRelay.startsWith('wss://')}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
