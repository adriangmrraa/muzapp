import { Tag, getTagColor } from "@/components/ui/tag";

interface TagListProps {
  tags: string[];
  className?: string;
}

export function TagList({ tags, className }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {tags.map((tag) => (
        <Tag key={tag} color={getTagColor(tag)}>
          {tag}
        </Tag>
      ))}
    </div>
  );
}
