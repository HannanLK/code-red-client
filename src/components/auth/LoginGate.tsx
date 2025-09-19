"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginGate() {
  const { user, saveToken, setAuthUser } = useAuth();
  const [name, setName] = useState('');

  if (user) return null;

  const onContinue = () => {
    const username = (name || 'Player').trim();
    saveToken(username);
    setAuthUser({ id: 'me', name: username });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Enter your name to play</h2>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
          />
          <Button onClick={onContinue} className="w-full">Continue</Button>
        </CardContent>
      </Card>
    </div>
  );
}
