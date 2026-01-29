import { useEffect, useState } from "react";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:3000";

export default function App() {
  const [message, setMessage] = useState<string>("...");

  useEffect(() => {
    fetch(`${API_ORIGIN}/`)
      .then((r) => r.json())
      .then((d) => setMessage(d.message ?? "ok"))
      .catch(() => setMessage("failed to reach API"));
  }, []);

  return (
    <div>
      <h1>ai-node</h1>
      <p>API: {message}</p>
    </div>
  );
}
