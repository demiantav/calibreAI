import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  mode: 'board' | 'list';
  onChange: (mode: 'board' | 'list') => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-hover rounded-2xl p-1 border border-border/50">
      <button
        onClick={() => onChange('board')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
          mode === 'board'
            ? 'bg-accent text-white shadow-md'
            : 'text-text-tertiary hover:text-text'
        }`}
        aria-label="Vista de board"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Board
      </button>
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
          mode === 'list'
            ? 'bg-accent text-white shadow-md'
            : 'text-text-tertiary hover:text-text'
        }`}
        aria-label="Vista de lista"
      >
        <List className="w-3.5 h-3.5" />
        List
      </button>
    </div>
  );
}
