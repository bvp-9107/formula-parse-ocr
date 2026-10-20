export interface ParsedBlock {
  id: string;
  type: 'paragraph' | 'display_equation' | 'inline_equation';
  content: string;
  confidence?: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ViewMode = 'web' | 'word_add_in';
