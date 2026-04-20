import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
}

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 100;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2, // Subtle drift
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random(),
          fadeSpeed: Math.random() * 0.01 + 0.005,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        // Update positions
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Update twinkling
        p.opacity += p.fadeSpeed;
        if (p.opacity > 1 || p.opacity < 0.2) {
          p.fadeSpeed *= -1;
        }

        // Draw star
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Layer: Clean Cosmic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: 'url("/cosmic-background.png")',
          filter: 'brightness(1.1) contrast(1.1)'
        }}
      />
      
      {/* Particle Layer: Twinkling Stars */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-80"
      />

      {/* Shimmering Dust/Trail Overlay */}
      <div 
        className="absolute inset-0 z-10 animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle at 70% 40%, rgba(255, 182, 193, 0.1), transparent 40%)',
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Dark vignette to focus form */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};
