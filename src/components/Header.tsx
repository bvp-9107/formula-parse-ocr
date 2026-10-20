import React from 'react';
import { Sun, Moon, Monitor, FileText, Layout, ScanLine, Settings, UserCheck, LogIn } from 'lucide-react';
import { ThemeMode, ViewMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  userSession: any;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  viewMode,
  setViewMode,
  onOpenSettings,
  onOpenAuth,
  userSession
}) => {
  return (
    <header className="border-b border-gray-200 dark:border-yt-border bg-white dark:bg-yt-surface px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg text-white font-bold flex items-center gap-2 shadow-sm">
          <ScanLine className="w-5 h-5" />
          <span className="text-base tracking-tight font-semibold">FormulaParse OCR</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 dark:bg-yt-bg p-1 rounded-lg border border-gray-200 dark:border-yt-border">
          <button
            onClick={() => setViewMode('web')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'web'
                ? 'bg-white dark:bg-yt-surface text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Web App
          </button>
          <button
            onClick={() => setViewMode('word_add_in')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'word_add_in'
                ? 'bg-white dark:bg-yt-surface text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Word Add-in
          </button>
        </div>

        {userSession && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-yt-bg hover:bg-gray-200 dark:hover:bg-yt-hover text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-yt-border transition text-xs font-medium"
            title="Settings"
          >
            <Settings className="w-4 h-4" /> <span>Settings</span>
          </button>
        )}

        {/* 3-Way System / Dark / Light Theme Toggle */}
        <div className="flex bg-gray-100 dark:bg-yt-bg p-1 rounded-lg border border-gray-200 dark:border-yt-border">
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md text-xs font-medium transition ${
              theme === 'system'
                ? 'bg-white dark:bg-yt-surface text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="System Default Theme"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md text-xs font-medium transition ${
              theme === 'dark'
                ? 'bg-white dark:bg-yt-surface text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Dark Mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md text-xs font-medium transition ${
              theme === 'light'
                ? 'bg-white dark:bg-yt-surface text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Light Mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>

        {userSession ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            {userSession.user?.user_metadata?.display_name || userSession.user?.user_metadata?.full_name || userSession.user?.email?.split('@')[0] || 'Account'}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
