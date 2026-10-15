import React, {CSSProperties, ElementType, ReactNode, useCallback, useEffect, useRef} from 'react';

const defaultStyle: CSSProperties = {
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

type DetectableOverflowProps = {
  children: ReactNode;
  onChange?: (overflow: boolean) => void;
  tag?: ElementType;
  style?: CSSProperties;
  className?: string;
};

export const DetectableOverflow = ({
  children,
  onChange,
  tag: Tag = 'div',
  style = defaultStyle,
  className,
}: DetectableOverflowProps) => {
  const ref = useRef<HTMLElement>(null);
  const overflowRef = useRef(false);

  const updateState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const newOverflow = el.offsetWidth < el.scrollWidth || el.offsetHeight < el.scrollHeight;
    if (newOverflow === overflowRef.current) return;
    overflowRef.current = newOverflow;
    onChange?.(newOverflow);
  }, [onChange]);

  // Gated on `children`: `updateState` reads `offsetWidth`/`scrollWidth`, a forced synchronous
  // layout, and one of these sits behind every ellipsized label. Pass a memoized element - fresh
  // JSX per render defeats the gate. The ResizeObserver below covers size changes no render causes.
  useEffect(() => {
    updateState();
  }, [children, style, className, updateState]);

  // ResizeObserver — catches container size changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(updateState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateState]);

  // A font swap widens the text without changing this element's box, so neither the observer above
  // (which watches the box) nor the gate on `children` notices it. `loadingdone` covers the initial
  // swap and any later subset; absent in jsdom and on browsers without the Font Loading API.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    let cancelled = false;
    const remeasure = () => {
      if (!cancelled) updateState();
    };
    fonts.ready.then(remeasure);
    fonts.addEventListener('loadingdone', remeasure);
    return () => {
      cancelled = true;
      fonts.removeEventListener('loadingdone', remeasure);
    };
  }, [updateState]);

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} style={style} className={className}>
      {children}
    </Tag>
  );
};
