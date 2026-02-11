import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as llmApi from '@/api/llm-config';
import type { LlmConfigItem } from '@/api/llm-config';

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

type LlmConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editConfig?: LlmConfigItem;
  onSuccess?: () => void;
};

export function LlmConfigDialog({ open, onOpenChange, editConfig, onSuccess }: LlmConfigDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const isEditing = Boolean(form.id);

  // 当弹框打开或编辑配置变化时，更新表单
  useEffect(() => {
    if (open) {
      if (editConfig) {
        setForm({
          id: editConfig.id,
          name: editConfig.name,
          provider: editConfig.provider,
          baseURL: editConfig.baseURL,
          modelId: editConfig.modelId,
          apiKey: '',
          isDefault: editConfig.isDefault,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError('');
    }
  }, [open, editConfig]);

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
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setError('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑配置' : '新增配置'}</DialogTitle>
          <DialogDescription>API Key 只写不读：保存后不会展示明文</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="dialog-name">名称</Label>
            <Input
              id="dialog-name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="例如：公司网关 GPT"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dialog-provider">Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(v) => setForm((s) => ({ ...s, provider: v as llmApi.LlmProvider }))}
              disabled={saving}
            >
              <SelectTrigger id="dialog-provider" className="w-full">
                <SelectValue placeholder="选择 Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">openai</SelectItem>
                <SelectItem value="deepseek">deepseek</SelectItem>
                <SelectItem value="alibaba">alibaba</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dialog-baseURL">Base URL</Label>
            <Input
              id="dialog-baseURL"
              value={form.baseURL}
              onChange={(e) => setForm((s) => ({ ...s, baseURL: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dialog-modelId">Model ID</Label>
            <Input
              id="dialog-modelId"
              value={form.modelId}
              onChange={(e) => setForm((s) => ({ ...s, modelId: e.target.value }))}
              placeholder="gpt-5.2 / deepseek-chat / glm-4-..."
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dialog-apiKey">API Key{isEditing ? '（不填则保持不变）' : ''}</Label>
            <Input
              id="dialog-apiKey"
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
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '保存中…' : isEditing ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
