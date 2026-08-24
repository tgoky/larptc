import React, { useRef, useState } from 'react';
import './PullToRefresh.css';

const MAX_PULL = 88;
const READY_THRESHOLD = 60;
const REFRESH_HOLD = 48;
const MIN_REFRESH_SPIN_MS = 500;

export default function PullToRefresh({
  className = '',
  children,
  onRefresh,
  indicatorTop = 10,
}) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function resetPull() {
    draggingRef.current = false;
    startYRef.current = 0;
    setPullDistance(0);
    setIsReady(false);
  }

  function handleTouchStart(event) {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    startYRef.current = event.touches[0].clientY;
    draggingRef.current = true;
  }

  function handleTouchMove(event) {
    if (!draggingRef.current || isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) {
      resetPull();
      return;
    }

    const deltaY = event.touches[0].clientY - startYRef.current;
    if (deltaY <= 0) {
      setPullDistance(0);
      setIsReady(false);
      return;
    }

    const damped = Math.min(MAX_PULL, deltaY * 0.45);
    if (damped > 0) {
      event.preventDefault();
    }
    setPullDistance(damped);
    setIsReady(damped >= READY_THRESHOLD);
  }

  async function handleTouchEnd() {
    if (!draggingRef.current || isRefreshing) {
      resetPull();
      return;
    }

    draggingRef.current = false;

    if (!isReady || !onRefresh) {
      resetPull();
      return;
    }

    setIsRefreshing(true);
    setPullDistance(REFRESH_HOLD);
    try {
      await Promise.all([
        onRefresh(),
        new Promise((resolve) => window.setTimeout(resolve, MIN_REFRESH_SPIN_MS)),
      ]);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsReady(false);
    }
  }

  const progress = Math.min(pullDistance / READY_THRESHOLD, 1);
  const segmentCount = 8;

  return (
    <div className="ptr-viewport">
      <div
        className={`ptr-indicator ${isRefreshing ? 'refreshing' : ''} ${(pullDistance > 0 || isRefreshing) ? 'visible' : ''}`}
        aria-hidden="true"
        style={{ top: indicatorTop }}
      >
        <div className="ptr-spinner">
          {Array.from({ length: segmentCount }).map((_, index) => {
            const segmentProgress = Math.max(0, Math.min(progress * segmentCount - index, 1));
            return (
            <span
              key={`segment-${index}`}
              className="ptr-spinner-segment"
              style={{
                transform: `translate(-50%, -50%) rotate(${index * (360 / segmentCount)}deg)`,
                opacity: isRefreshing ? undefined : 0.18 + (segmentProgress * 0.82),
              }}
            />
            );
          })}
        </div>
      </div>
      <div
        ref={containerRef}
        className={`ptr-scroll ${className}`.trim()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={`ptr-content ${isRefreshing ? 'refreshing' : ''}`}
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
