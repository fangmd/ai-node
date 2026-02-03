import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getMe, type MeData } from "@/api/me"
import { clearToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Me() {
  const navigate = useNavigate()
  const [user, setUser] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = () => {
    clearToken()
    navigate("/login", { replace: true })
  }

  useEffect(() => {
    getMe()
      .then((res) => {
        const d = res.data
        setUser(d?.code === 200 && d?.data ? d.data : null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <p className="text-muted-foreground">无法获取个人信息</p>
        <Link to="/login" className="text-primary underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">个人信息</h1>
        <Link to="/" className="text-primary underline">
          首页
        </Link>
        <Link to="/chat" className="text-primary underline">
          Chat
        </Link>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>账号信息</CardTitle>
          <CardDescription>当前登录用户</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-muted-foreground text-sm">用户 ID：</span>
            <span className="font-mono">{user.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">用户名：</span>
            <span>{user.username}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
