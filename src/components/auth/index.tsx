"use client";
import React, { useState } from 'react';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent } from '@/components/common/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function AuthPanel() {
  const { saveToken, setAuthUser, token, user } = useAuth();
  const [name, setName] = useState('');

  const onLogin = () => {
    const fakeToken = 'demo-token';
    saveToken(fakeToken);
    setAuthUser({ id: 'me', name: name || 'Player' });
  };

  const onLogout = () => {
    saveToken(null);
    setAuthUser(null);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-sm opacity-70">Auth Demo</div>
        {user ? (
          <div className="flex items-center gap-2">
            <span>Welcome, {user.name}</span>
            <Button onClick={onLogout} variant="outline">Logout</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 bg-transparent" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={onLogin}>Login</Button>
          </div>
        )}
        <div className="text-xs opacity-60">Token: {token ?? 'none'}</div>
      </CardContent>
    </Card>
  );
}

export default AuthPanel;
