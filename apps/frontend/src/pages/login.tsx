import { useState, FormEvent } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { request } from "@/lib/api"
import { setToken, getToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "login" | "register"

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (getToken()) {
    return <Navigate to="/chat" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    const trimmedUser = username.trim()
    const trimmedPass = password.trim()
    if (!trimmedUser || !trimmedPass) {
      setError("请输入用户名和密码")
      return
    }
    if (mode === "register") {
      if (trimmedPass !== confirmPassword.trim()) {
        setError("两次密码输入不一致")
        return
      }
    }
    setLoading(true)
    try {
      if (mode === "register") {
        const res = await request("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUser,
            password: trimmedPass,
          }),
        })
        const data = (await res.json()) as {
          code?: number
          msg?: string
          data?: { username?: string }
        }
        if (res.ok && data?.code === 200) {
          const loginRes = await request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: trimmedUser,
              password: trimmedPass,
            }),
          })
          const loginData = (await loginRes.json()) as {
            code?: number
            data?: { token?: string }
          }
          if (
            loginRes.ok &&
            loginData?.code === 200 &&
            loginData?.data?.token
          ) {
            setToken(loginData.data.token)
            navigate("/chat", { replace: true })
            return
          }
        }
        setError(data?.msg ?? "注册失败")
      } else {
        const res = await request("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUser,
            password: trimmedPass,
          }),
        })
        const data = (await res.json()) as {
          code?: number
          msg?: string
          data?: { token?: string }
        }
        if (res.ok && data?.code === 200 && data?.data?.token) {
          setToken(data.data.token)
          navigate("/chat", { replace: true })
          return
        }
        setError(data?.msg ?? "登录失败")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "login" ? "登录" : "注册"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                disabled={loading}
              />
            </div>
            {mode === "register" && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            )}
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "登录中…"
                  : "注册中…"
                : mode === "login"
                  ? "登录"
                  : "注册"}
            </Button>
            <button
              type="button"
              className="text-muted-foreground text-sm underline hover:text-foreground"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login")
                setError("")
                setConfirmPassword("")
              }}
            >
              {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
