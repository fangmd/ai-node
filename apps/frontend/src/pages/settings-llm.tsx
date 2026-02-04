import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from 'zustand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LlmConfigDialog } from '@/components/llm-config-dialog';
import { llmConfigStore } from '@/stores/llm-config';
import * as llmApi from '@/api/llm-config';
import type { LlmConfigItem } from '@/api/llm-config';

export default function LlmSettings() {
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<LlmConfigItem | undefined>(undefined);

  const llmConfigs = useStore(llmConfigStore, (s) => s.llmConfigs);
  const loading = useStore(llmConfigStore, (s) => s.loading);
  const refreshLlmConfigs = useStore(llmConfigStore, (s) => s.refresh);
  const removeLlmConfig = useStore(llmConfigStore, (s) => s.removeLlmConfig);

  const sorted = useMemo(() => {
    return [...llmConfigs].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [llmConfigs]);

  useEffect(() => {
    refreshLlmConfigs().catch(() => {
      // Error handling is done in store
    });
  }, [refreshLlmConfigs]);

  function handleOpenDialog(config?: LlmConfigItem) {
    setEditConfig(config);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    // 刷新配置列表
    refreshLlmConfigs().catch(() => {
      // Error handling is done in store
    });
  }

  async function handleDelete(id: string) {
    setPageError('');
    setSaving(true);
    try {
      const r = await llmApi.deleteLlmConfig(id);
      if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '删除失败');
      removeLlmConfig(id);
      if (editConfig?.id === id) {
        setEditConfig(undefined);
        setDialogOpen(false);
      }
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    setPageError('');
    setSaving(true);
    try {
      const r = await llmApi.setDefaultLlmConfig(id);
      if (r.data?.code !== 200) throw new Error(r.data?.msg ?? '设置默认失败');
      await refreshLlmConfigs();
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : '设置默认失败');
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

      {pageError && (
        <p className="text-destructive text-sm" role="alert">
          {pageError}
        </p>
      )}

      <LlmConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editConfig={editConfig}
        onSuccess={handleDialogSuccess}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>我的配置</CardTitle>
              <CardDescription>默认配置会优先用于新会话和未绑定会话</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} disabled={saving}>
              新增配置
            </Button>
          </div>
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
                    onClick={() => handleOpenDialog(x)}
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

