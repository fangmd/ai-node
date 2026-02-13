import { Button } from '@/components/ui/button';

export interface ActiveArtifact {
  messageId: string;
  index: number;
}

interface ArtifactsViewProps {
  activeArtifact: ActiveArtifact | null;
  getHtml: (messageId: string, index: number) => string | undefined;
  onClose: () => void;
}

export function ArtifactsView({ activeArtifact, getHtml, onClose }: ArtifactsViewProps) {
  if (!activeArtifact) return null;

  const html = getHtml(activeArtifact.messageId, activeArtifact.index);
  if (html == null) return null;

  return (
    <div className="flex flex-col h-full border-l bg-background w-[420px] shrink-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">HTML 预览</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          关闭
        </Button>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <iframe
          title="HTML Artifact"
          srcDoc={html}
          sandbox="allow-scripts"
          className="w-full h-full min-h-[300px] rounded border bg-white"
        />
      </div>
    </div>
  );
}
