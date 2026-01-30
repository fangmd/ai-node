import { Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import About from "./pages/about"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
