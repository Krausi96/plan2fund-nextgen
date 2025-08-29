import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number; // ms per char
  className?: string;
  loop?: boolean;
  blinkCursor?: boolean;
};

export default function TypedText({ text, speed = 24, className, loop = false, blinkCursor = true }: Props) {
  const [display, setDisplay] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    let raf: number;
    let timeout: number;

    const tick = () => {
      if (indexRef.current < text.length) {
        setDisplay((prev) => prev + text.charAt(indexRef.current));
        indexRef.current += 1;
        timeout = window.setTimeout(() => (raf = requestAnimationFrame(tick)), speed);
      } else if (loop) {
        // small pause then restart
        timeout = window.setTimeout(() => {
          setDisplay("");
          indexRef.current = 0;
          raf = requestAnimationFrame(tick);
        }, 1200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [text, speed, loop]);

  return (
    <span className={className}>
      {display}
      {blinkCursor && <span className="ml-0.5 inline-block w-[1ch] animate-blink">|</span>}
    </span>
  );
}
