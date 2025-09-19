"use client";
import React from 'react';
import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent } from '@/components/common/ui/card';

export function Timer({ seconds = 60 }: { seconds?: number }) {
  const [time, setTime] = useState(seconds);
  const controls = useAnimation();

  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (time <= 10) {
      controls.start({ scale: [1, 1.1, 1], transition: { duration: 0.6 } });
    }
  }, [time, controls]);

  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');

  return (
    <Card>
      <CardContent className="p-3">
        <motion.span animate={controls} className={time <= 10 ? 'text-red-500 font-bold' : ''}>
          {mm}:{ss}
        </motion.span>
      </CardContent>
    </Card>
  );
}

export default Timer;
