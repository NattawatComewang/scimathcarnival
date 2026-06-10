import { useEffect, useState } from 'react';

export function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function useCountdown(target: Date | null) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!target) return;
    function tick() {
      const diff = target!.getTime() - Date.now();
      if (diff <= 0) { setText(''); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(d > 0 ? `${d} วัน ${h} ชม. ${m} นาที` : `${h} ชม. ${m} นาที ${s} วิ`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return text;
}
