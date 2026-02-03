import { useEffect } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { setOnUnauthorized } from "@/lib/request"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Home from "./pages/home"
import About from "./pages/about"
import Chat from "./pages/chat"
import Login from "./pages/login"
import Me from "./pages/me"

export default function App() {
  const navigate = useNavigate()
  useEffect(() => {
    setOnUnauthorized(() => navigate("/login", { replace: true }))
    return () => setOnUnauthorized(null)
  }, [navigate])

  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="me" element={<Me />} />
      </Route>
    </Routes>
  )
}
