import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('classcode_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light-theme');
    } else {
      setIsDark(true);
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('classcode_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('classcode_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white transition-all shadow-lg cursor-pointer flex items-center justify-center"
      title={isDark ? "Cambiar a Modo Día" : "Cambiar a Modo Noche"}
    >
      {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-purple-500" />}
    </button>
  );
}