import { Toaster } from "sonner";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HouseSync } from "@/components/house-sync";
import { useHouseStore } from "@/lib/house-store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import appCss from "../styles.css?url";

const APP_NAME = "오늘차례";

function PersistGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useHouseStore.persist.rehydrate();
  }, []);
  return children;
}

function SyncWhenSignedIn() {
  const { user, isPending } = useCurrentUserState();
  if (isPending || !user) return null;
  return <HouseSync />;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "오늘 집 일은 누구 차례인지 한 화면에. 당번, 장보기, 공평 기록.",
      },
      { name: "theme-color", content: "#12110f" },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="ko" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg font-sans text-foreground">
        <PreviewHostBridge />
        <AuthProvider>
          <PersistGate>
            <SyncWhenSignedIn />
            <Outlet />
          </PersistGate>
        </AuthProvider>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className: "bg-card text-foreground border-border",
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
