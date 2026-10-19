'use client';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'nutrition', label: 'Nutrición', icon: '🥑' },
    { id: 'habits', label: 'Hábitos', icon: '⚡' },
    { id: 'workout', label: 'Workout', icon: '💪' }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
