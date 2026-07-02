import React, { Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "./components/AppLayout"

const DiaryPage = React.lazy(() => import("./pages/DiaryPage"))
const FavoritesPage = React.lazy(() => import("./pages/FavoritesPage"))
const HomePage = React.lazy(() => import("./pages/HomePage"))
const ListDetailsPage = React.lazy(() => import("./pages/ListDetailsPage"))
const ListsPage = React.lazy(() => import("./pages/ListsPage"))
const MovieDetailsPage = React.lazy(() => import("./pages/MovieDetailsPage"))
const SearchPage = React.lazy(() => import("./pages/SearchPage"))
const StatisticsPage = React.lazy(() => import("./pages/StatisticsPage"))
const WatchlistPage = React.lazy(() => import("./pages/WatchlistPage"))

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink p-8">
          <div className="max-w-md rounded-lg border border-coral/30 bg-coral/10 p-8 text-center">
            <h1 className="text-2xl font-black text-white">Something went wrong</h1>
            <p className="mt-4 text-sm text-white/70">{this.state.error.message}</p>
            <button
              className="primary-button mt-6"
              onClick={() => { this.setState({ error: null }); window.location.href = "/" }}
            >
              Go home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function PageFallback() {
  return (
    <div className="page-shell">
      <div className="h-[400px] animate-pulse rounded-lg bg-white/10" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Suspense fallback={<PageFallback />}><HomePage /></Suspense>} />
          <Route path="search" element={<Suspense fallback={<PageFallback />}><SearchPage /></Suspense>} />
          <Route path="movies/:movieId" element={<Suspense fallback={<PageFallback />}><MovieDetailsPage /></Suspense>} />
          <Route path="diary" element={<Suspense fallback={<PageFallback />}><DiaryPage /></Suspense>} />
          <Route path="watchlist" element={<Suspense fallback={<PageFallback />}><WatchlistPage /></Suspense>} />
          <Route path="favorites" element={<Suspense fallback={<PageFallback />}><FavoritesPage /></Suspense>} />
          <Route path="lists" element={<Suspense fallback={<PageFallback />}><ListsPage /></Suspense>} />
          <Route path="lists/:listId" element={<Suspense fallback={<PageFallback />}><ListDetailsPage /></Suspense>} />
          <Route path="statistics" element={<Suspense fallback={<PageFallback />}><StatisticsPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
