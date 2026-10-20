import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ latex, displayMode = true }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode: displayMode,
          throwOnError: false
        });
      } catch (e) {
        containerRef.current.innerText = latex;
      }
    }
  }, [latex, displayMode]);

  return <span ref={containerRef} className="my-1 inline-block" />;
};
