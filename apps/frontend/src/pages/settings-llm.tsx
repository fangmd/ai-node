import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as llmApi from '@/api/llm-config';

type FormState = {
  id?: string;
  name: string;
  provider: llmApi.LlmProvider;
  baseURL: string;
  modelId: string;
  apiKey: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  provider: 'openai',
  baseURL: '',
  modelId: '',
  apiKey: '',
  isDefault: false,
};

export default function LlmSettings() {
  const [list, setList] = useState<llmApi.LlmConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const isEditing = Boolean(form.id);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [list]);

  async function refresh() {
    const res = await llmApi.fetchLlmConfigs();
    const data = res.data;
    const items = data?.code === 200 && Array.isArray(data.data) ? data.data : [];
    setList(items);
  }

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    setError('');
    const name = form.name.trim();
    const baseURL = form.baseURL.trim();
    const modelId = form.modelId.trim();
    const apiKey = form.apiKey.trim();

    if (!name || !baseURL || !modelId) {
      setError('请填写名称、Base URL、Model ID');
      return;
    }
    if (!isEditing && !apiKey) {
      setError('新增配置必须填写 API Key');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const payload: llmApi.UpdateLlmConfigInput = {
          name,
          provider: form.provider,
          baseURL,
          modelId,
          ...(apiKey ? { apiKey } : {}),
        };
        const r = await llmApi.updateLlmConfig(form.id!, payload);
        if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '保存失败');
        if (form.isDefault) {
          await llmApi.setDefaultLlmConfig(form.id!);
        }
      } else {
        const r = await llmApi.createLlmConfig({
          name,
          provider: form.provider,
          baseURL,
          modelId,
          apiKey,
          isDefault: form.isDefault,
        });
        if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '创建失败');
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError('');
    setSaving(true);
    try {
      const r = await llmApi.deleteLlmConfig(id);
      if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '删除失败');
      await refresh();
      if (form.id === id) setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    setError('');
    setSaving(true);
    try {
      const r = await llmApi.setDefaultLlmConfig(id);
      if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '设置默认失败');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '设置默认失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">大模型管理</h1>
        <Link to="/settings" className="text-primary underline">
          设置
        </Link>
        <Link to="/chat" className="text-primary underline">
          Chat
        </Link>
        <Link to="/" className="text-primary underline">
          首页
        </Link>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? '编辑配置' : '新增配置'}</CardTitle>
          <CardDescription>API Key 只写不读：保存后不会展示明文</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="例如：公司网关 GPT"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              className="border rounded px-3 py-2 bg-background"
              value={form.provider}
              onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value as llmApi.LlmProvider }))}
              disabled={saving}
            >
              <option value="openai">openai</option>
              <option value="deepseek">deepseek</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="baseURL">Base URL</Label>
            <Input
              id="baseURL"
              value={form.baseURL}
              onChange={(e) => setForm((s) => ({ ...s, baseURL: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="modelId">Model ID</Label>
            <Input
              id="modelId"
              value={form.modelId}
              onChange={(e) => setForm((s) => ({ ...s, modelId: e.target.value }))}
              placeholder="gpt-5.2 / deepseek-chat / glm-4-..."
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key{isEditing ? '（不填则保持不变）' : ''}</Label>
            <Input
              id="apiKey"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((s) => ({ ...s, apiKey: e.target.value }))}
              placeholder={isEditing ? '留空则不更新' : 'sk-...'}
              disabled={saving}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
              disabled={saving}
            />
            设为默认
          </label>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? '保存中…' : isEditing ? '保存' : '创建'}
            </Button>
            {isEditing && (
              <Button variant="secondary" onClick={() => setForm(EMPTY_FORM)} disabled={saving}>
                取消编辑
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>我的配置</CardTitle>
          <CardDescription>默认配置会优先用于新会话和未绑定会话</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无配置，请先新增一条。</p>
          ) : (
            sorted.map((x) => (
              <div key={x.id} className="border rounded p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {x.name}{' '}
                    {x.isDefault && <span className="text-xs text-primary align-middle">默认</span>}
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    {x.provider} · {x.modelId} · {x.baseURL}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!x.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => handleSetDefault(x.id)} disabled={saving}>
                      设默认
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setForm({
                        id: x.id,
                        name: x.name,
                        provider: x.provider,
                        baseURL: x.baseURL,
                        modelId: x.modelId,
                        apiKey: '',
                        isDefault: x.isDefault,
                      })
                    }
                    disabled={saving}
                  >
                    编辑
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(x.id)} disabled={saving}>
                    删除
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

