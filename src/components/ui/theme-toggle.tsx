import React from "react";

const ThemeToggle = () => {
  // Alterna entre dark/light adicionando/removendo a classe 'dark' no <html>
  const [isDark, setIsDark] = React.useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  React.useEffect(() => {
    // Detecta preferência do usuário
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setIsDark(true);
    if (saved === "light") setIsDark(false);
  }, []);

  return (
    <button
      aria-label="Alternar modo escuro"
      className="rounded p-2 border bg-background hover:bg-muted transition-colors"
      onClick={() => setIsDark((d) => !d)}
      title={isDark ? "Modo claro" : "Modo escuro"}
      type="button"
    >
      {isDark ? (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M17.75 15.5a7.25 7.25 0 01-7.25-7.25c0-2.1.9-3.98 2.33-5.28A.75.75 0 0012 2a10 10 0 1010 10 .75.75 0 00-1.22-.58A7.22 7.22 0 0117.75 15.5z"
          />
        </svg>
      ) : (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="5.75"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
