import { useMemo } from "react";
import katex from "katex";

/**
 * MathText — renders inline LaTeX via KaTeX.
 * Supports mixed text: "Solve $x^2 + 1 = 0$ for $x$"
 * Renders $...$ as inline math.
 */
export default function MathText({ children, className = "" }) {
  const html = useMemo(() => {
    if (!children) return "";
    // Split on $...$ patterns, render each math segment
    return children.replace(/\$(.+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        return tex;
      }
    });
  }, [children]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * MathBlock — renders display-mode LaTeX (centered, larger).
 */
export function MathBlock({ children, className = "" }) {
  const html = useMemo(() => {
    if (!children) return "";
    const tex = children.replace(/^\$\$?|\$\$?$/g, "").trim();
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return tex;
    }
  }, [children]);

  return (
    <div
      className={`my-4 text-center ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
