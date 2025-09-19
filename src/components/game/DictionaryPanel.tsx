"use client";
import React from 'react';
import { Card, CardContent } from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';

export default function DictionaryPanel() {
  const [word, setWord] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ word: string; valid: boolean; definition?: string | null } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onCheck = async () => {
    const w = word.trim();
    if (!w) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '');
      const url = `${base}/dict/validate?word=${encodeURIComponent(w)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to check word');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCheck();
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-lg font-semibold">Dictionary</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter a word"
            className="flex-1 rounded border px-3 py-2 bg-white/70 dark:bg-neutral-800"
            aria-label="Dictionary word input"
          />
          <Button onClick={onCheck} disabled={loading || !word.trim()} aria-busy={loading}>
            {loading ? 'Checking…' : 'Check'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {result && (
          <div className="text-sm">
            <p>
              <span className="font-semibold">{result.word}</span>: {result.valid ? (
                <span className="text-green-600">Valid</span>
              ) : (
                <span className="text-red-600">Not valid</span>
              )}
            </p>
            {result.definition && (
              <p className="opacity-80 mt-1">{result.definition}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
