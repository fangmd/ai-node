import { useEffect } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { setOnUnauthorized } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Home from "./pages/home"
import About from "./pages/about"
import Chat from "./pages/chat"
import Login from "./pages/login"

export default function App() {
  const navigate = useNavigate()
  useEffect(() => {
    setOnUnauthorized(() => navigate("/login", { replace: true }))
    return () => setOnUnauthorized(null)
  }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="chat" element={<Chat />} />
      </Route>
    </Routes>
  )
}
