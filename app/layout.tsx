import type { Metadata } from "next";
import "./globals.css";
import { display } from "@/lib/fonts";
import { Sidebar } from "@/components/Sidebar";
import { TopBar, MobileNav } from "@/components/TopBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "flowdesk — automation control",
  description: "One home for every automation. Trigger, monitor, and manage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={display.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('flowdesk-theme');if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}",
          }}
        />
      </head>
      <body className="bg-bg text-text">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <MobileNav />
          </div>
        </div>
      </body>
    </html>
  );
}
