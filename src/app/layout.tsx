import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PR Board",
  description: "Kanban view of your GitHub pull requests",
};

// Inline script to set the dark class before hydration, so the page doesn't
// flash light-on-dark (or vice versa) when the saved theme differs from the
// system default. Mirrors the logic in ThemeApplier / useSettings.
const themeBootstrapScript = `
(function(){try{
  var s = localStorage.getItem('pr-board-settings:v1');
  var theme = 'system';
  if (s) { var p = JSON.parse(s); if (p && (p.theme==='dark'||p.theme==='light'||p.theme==='system')) theme = p.theme; }
  var dark = theme==='dark' || (theme==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
