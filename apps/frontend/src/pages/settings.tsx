import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">设置</h1>
        <Link to="/" className="text-primary underline">
          首页
        </Link>
        <Link to="/chat" className="text-primary underline">
          Chat
        </Link>
        <Link to="/me" className="text-primary underline">
          个人信息
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>大模型管理</CardTitle>
          <CardDescription>管理你自己的大模型配置（provider / baseURL / modelId / apiKey）</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/settings/llm" className="text-primary underline">
            进入大模型管理
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

