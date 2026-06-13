import { useAppStore } from '../store/useAppStore';
import type { Section } from '../types';

const menuItems: { id: Section; label: string; icon: string }[] = [
  { id: 'content-plan', label: 'Контент-план', icon: '📋' },
  { id: 'mailing', label: 'Рассылки', icon: '✉️' },
  { id: 'podcast', label: 'Подкасты', icon: '🎙️' },
  { id: 'video-avatar', label: 'Видео-аватар', icon: '🎬' },
];

export function Sidebar() {
  const { activeSection, setActiveSection, setSettingsOpen } = useAppStore();

  return (
    <aside className="w-64 min-h-screen bg-green-800 text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-green-700">
        <h1 className="text-lg font-bold leading-tight">AI Контент<br />Мейкер</h1>
      </div>
      <nav className="flex-1 py-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full text-left px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
              activeSection === item.id
                ? 'bg-green-600/50 font-medium'
                : 'hover:bg-green-700/50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-green-700 p-3">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-green-700/50 rounded-lg transition-colors"
        >
          <span>⚙️</span>
          Настройки
        </button>
      </div>
    </aside>
  );
}
