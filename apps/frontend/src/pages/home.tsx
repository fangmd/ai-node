import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ApiResponse } from "@ai-node/types";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:3000";

export default function Home() {
  const [message, setMessage] = useState<string>("...");

  useEffect(() => {
    fetch(`${API_ORIGIN}/`)
      .then((r) => r.json() as Promise<ApiResponse<{ message?: string }>>)
      .then((d) => setMessage(d.data?.message ?? "ok"))
      .catch(() => setMessage("failed to reach API"));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">ai-node</h1>
      <p>API: {message}</p>
      <Link to="/about" className="text-blue-600 underline">
        About
      </Link>
    </div>
  );
}
