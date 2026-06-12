'use client';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Pill search field with a leading icon and a clear button; grows to fill its row.
export default function SearchInput({ value, onChange, placeholder, autoFocus }: SearchInputProps) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
      <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
      <input
        style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem', width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && <button onClick={() => onChange('')} style={{ color: 'var(--text-3)' }}><X className="w-[13px] h-[13px]" /></button>}
    </div>
  );
}
