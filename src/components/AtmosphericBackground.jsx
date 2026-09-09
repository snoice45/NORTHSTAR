import React, { useEffect, useRef } from 'react';

export default function AtmosphericBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle drifting organic micro-nodes in champagne / slate tones
    const nodeCount = Math.min(Math.floor((width * height) / 28000), 35);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.8,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.35 + 0.15,
        phase: Math.random() * Math.PI * 2
      });
    }

    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Render delicate organic abstract ribbon contours (soft champagne & alabaster curves)
      const contourCount = 3;
      for (let c = 0; c < contourCount; c++) {
        ctx.beginPath();
        const baseHeight = height * (0.35 + c * 0.22);
        const amplitude = 45 + c * 20;
        const frequency = 0.0009 + c * 0.0004;
        const speed = time * (0.6 + c * 0.25);

        ctx.moveTo(0, height);
        ctx.lineTo(0, baseHeight + Math.sin(speed) * amplitude);

        for (let x = 0; x <= width; x += 20) {
          const y = baseHeight + 
                    Math.sin(x * frequency + speed) * amplitude + 
                    Math.cos(x * frequency * 0.6 - speed * 0.5) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Very soft translucent champagne & warm ivory gradient washes
        const grad = ctx.createLinearGradient(0, baseHeight - amplitude, 0, height);
        if (c === 0) {
          grad.addColorStop(0, 'rgba(230, 218, 198, 0.25)');
          grad.addColorStop(0.6, 'rgba(240, 232, 218, 0.12)');
          grad.addColorStop(1, 'transparent');
        } else if (c === 1) {
          grad.addColorStop(0, 'rgba(215, 202, 185, 0.2)');
          grad.addColorStop(0.5, 'rgba(235, 226, 212, 0.1)');
          grad.addColorStop(1, 'transparent');
        } else {
          grad.addColorStop(0, 'rgba(200, 190, 175, 0.15)');
          grad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle architectural contour lines in warm stone
        ctx.strokeStyle = c === 0 
          ? 'rgba(180, 165, 145, 0.22)' 
          : c === 1 
            ? 'rgba(195, 180, 160, 0.18)' 
            : 'rgba(210, 198, 180, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw faint architectural connection lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.15 * nodes[i].alpha;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(160, 140, 120, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Draw and update delicate champagne micro-nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        const currentAlpha = n.alpha + Math.sin(time * 2 + n.phase) * 0.12;
        const boundedAlpha = Math.max(0.08, Math.min(0.5, currentAlpha));

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(130, 115, 95, ${boundedAlpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="atmospheric-container" aria-hidden="true">
      {/* Warm Ivory / Cream / Champagne Architectural Base */}
      <div className="cream-base-canvas" />

      {/* Slowly Shifting Organic Warm Light Fields */}
      <div className="warm-light-field light-champagne-1" />
      <div className="warm-light-field light-alabaster-2" />
      <div className="warm-light-field light-ambermist-3" />
      <div className="warm-light-field light-lavenderpearl-4" />

      {/* Subtle Architectural Compass Reticle Lines */}
      <div className="architectural-orbit orbit-large" />
      <div className="architectural-orbit orbit-medium" />
      <div className="architectural-grid-texture" />

      {/* Organic Topography & Micro-Nodes Canvas */}
      <canvas ref={canvasRef} className="celestial-canvas" />
    </div>
  );
}
