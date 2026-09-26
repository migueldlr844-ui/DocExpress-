'use client';

interface BottomNavProps {
  currentStep: string;
  onNavigate: (step: string) => void;
}

export default function BottomNav({ currentStep, onNavigate }: BottomNavProps) {
  const NAV_ITEMS = [
    { id: 'home', label: 'ACCUEIL' },
    { id: 'docs', label: 'DOCUMENTS' },
    { id: 'orders', label: 'COMMANDES' },
    { id: 'profile', label: 'PROFIL' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050B14]/90 backdrop-blur-md border-t border-slate-800/80 py-3 px-4 flex justify-around items-center">
      {NAV_ITEMS.map((item) => {
        const isActive = currentStep === item.id || (item.id === 'home' && currentStep === 'home');
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center transition-colors text-[10px] font-mono tracking-widest ${
              isActive ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{item.label}</span>
            {isActive && <span className="h-1 w-1 bg-blue-500 rounded-full mt-1" />}
          </button>
        );
      })}
    </nav>
  );
}
