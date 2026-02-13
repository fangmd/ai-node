import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ActiveArtifact } from './artifacts-view';

interface HtmlArtifactCardProps {
  messageId: string;
  index: number;
  onOpen: (artifact: ActiveArtifact) => void;
}

export function HtmlArtifactCard({ messageId, index, onOpen }: HtmlArtifactCardProps) {
  return (
    <Card className="my-2 max-w-md">
      <CardHeader className="py-3">
        <span className="text-sm font-medium">HTML 预览</span>
      </CardHeader>
      <CardContent className="py-2">
        <Button variant="outline" size="sm" onClick={() => onOpen({ messageId, index })}>
          在 Artifacts 中查看
        </Button>
      </CardContent>
    </Card>
  );
}
