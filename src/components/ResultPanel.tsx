import { copyToClipboard } from '../utils/copyToClipboard';
import { downloadText } from '../utils/download';
import { useAppStore } from '../store/useAppStore';

interface ResultPanelProps {
  content: string;
  filename?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export function ResultPanel({ content, filename = 'result.txt', emptyMessage, actions }: ResultPanelProps) {
  const { setNotification } = useAppStore();

  const handleCopy = async () => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setNotification('Скопировано!');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleDownload = () => {
    downloadText(content, filename);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span className="text-sm font-medium text-slate-600">Результат</span>
        {content && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Копировать
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Скачать
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {content ? (
          <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{content}</pre>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            {emptyMessage || 'Здесь появится результат генерации'}
          </div>
        )}
      </div>
      {actions && content && (
        <div className="px-4 py-3 border-t border-slate-200 flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
