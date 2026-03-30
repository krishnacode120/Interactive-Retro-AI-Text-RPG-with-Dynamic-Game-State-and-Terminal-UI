import { useState, useEffect } from 'react';
import { playType } from '../lib/audio';

export function TypewriterText({ text, onComplete, speed = 30, active = true }: { text: string, onComplete?: () => void, speed?: number, active?: boolean }) {
  const [displayedText, setDisplayedText] = useState(active ? '' : text);

  useEffect(() => {
    if (!active) {
      setDisplayedText(text);
      return;
    }
    
    setDisplayedText('');
    let i = 0;
    
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      if (i % 2 === 0 && text[i] !== ' ') playType();
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      clearInterval(intervalId);
    };
  }, [text, speed, onComplete, active]);

  return <span>{displayedText}</span>;
}
