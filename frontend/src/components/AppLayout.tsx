import { Film, Heart, Home, List, Search, Sparkles, Star, CalendarDays } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/diary", label: "Diary", icon: CalendarDays },
  { to: "/watchlist", label: "Watchlist", icon: Film },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/lists", label: "Lists", icon: List },
  { to: "/statistics", label: "Stats", icon: Star },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-ink">
              <Sparkles size={20} />
            </span>
            <span className="hidden text-lg font-bold tracking-wide sm:block">Movie Box</span>
          </NavLink>
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      "flex min-w-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                  title={link.label}
                >
                  <Icon size={17} />
                  <span className="hidden lg:inline">{link.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
