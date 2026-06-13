import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { ContentPlan } from './components/ContentPlan';
import { MailingGenerator } from './components/MailingGenerator';
import { PodcastGenerator } from './components/PodcastGenerator';
import { VideoAvatarGenerator } from './components/VideoAvatarGenerator';
import { useEffect } from 'react';

function App() {
  const { activeSection, notification, error, setNotification, setError } = useAppStore();

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification, setNotification]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);

  return (
    <div className="flex min-h-screen bg-green-50">
      <Sidebar />
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-[calc(100vh-2rem)]">
          {activeSection === 'content-plan' && <ContentPlan />}
          {activeSection === 'mailing' && <MailingGenerator />}
          {activeSection === 'podcast' && <PodcastGenerator />}
          {activeSection === 'video-avatar' && <VideoAvatarGenerator />}
        </div>
      </main>
      <Settings />

      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-pulse">
          {notification}
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
