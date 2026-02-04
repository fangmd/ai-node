import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">ai-node</h1>
      <p className="text-muted-foreground">已登录，选择功能入口：</p>
      <nav className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/chat">Chat</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/me">个人信息</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/settings">设置</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/about">About</Link>
        </Button>
        <Button variant="outline" onClick={handleLogout} className="ml-auto">
          退出登录
        </Button>
      </nav>
    </div>
  );
}
