/** Design tokens from UIdesignrequirement.md + iPad WebApp UI.pdf */
export const design = {
  colors: {
    primary: "#002B7F",
    sidebar: "#001E5A",
    accent: "#0057FF",
    background: "#F7F9FC",
    card: "#FFFFFF",
    border: "#E5EAF2",
    muted: "#6B7280",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    rationale: "#EBF2FF",
    live: "#E11D48",
  },
  layout: {
    tabletMax: 1024,
    sidebarWidth: 210,
    headerHeight: 64,
    contentPadding: 24,
    cardRadius: 12,
    inputHeight: 42,
    buttonHeight: 42,
  },
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/courses/store", label: "Courses", icon: "courses" },
  { href: "/live-classes", label: "Live Classes", icon: "live" },
  { href: "/practice", label: "Practice", icon: "practice" },
  { href: "/bookmarks", label: "Bookmarks", icon: "bookmarks" },
  { href: "/progress", label: "Progress", icon: "progress" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/support", label: "Help & Support", icon: "support" },
] as const;
