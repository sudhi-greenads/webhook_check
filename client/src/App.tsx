import { BrowserRouter, Routes, Route } from "react-router-dom"
import { MainLayout } from "./layouts/MainLayout"
import Home from "./pages/Home"
import Logs from "./pages/Logs"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="logs/:name/:key" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
