import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "./components/AppLayout"
import DiaryPage from "./pages/DiaryPage"
import FavoritesPage from "./pages/FavoritesPage"
import HomePage from "./pages/HomePage"
import ListDetailsPage from "./pages/ListDetailsPage"
import ListsPage from "./pages/ListsPage"
import MovieDetailsPage from "./pages/MovieDetailsPage"
import SearchPage from "./pages/SearchPage"
import StatisticsPage from "./pages/StatisticsPage"
import WatchlistPage from "./pages/WatchlistPage"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="movies/:movieId" element={<MovieDetailsPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="lists/:listId" element={<ListDetailsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
