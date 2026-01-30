import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function About() {
  return (
    <div>
      <h1 className="text-3xl font-bold">About</h1>
      <p>Frontend SPA with Vite, Tailwind, React Router.</p>
      <Button variant="outline">hello</Button>
      <Link to="/" className="text-blue-600 underline">
        Home
      </Link>
    </div>
  )
}
