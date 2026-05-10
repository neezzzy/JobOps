import { Card } from './Card';
import { Body } from './Typography';

export function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <Body muted>{text}</Body>
    </Card>
  );
}
