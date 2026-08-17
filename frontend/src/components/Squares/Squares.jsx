import { useRef, useEffect } from 'react';
import './Squares.module.css'; 

const Squares = ({
  children, 
  direction = 'right',
  speed = 1,
  borderColor = '#999',
  squareSize = 50,
  hoverFillColor = '#222',
  className = ''
}) => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquareCoords = useRef(null); 
  const containerRef = useRef(null); 

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current; 

    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.scrollHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    resizeCanvas(); 

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      
      const startX = -((gridOffset.current.x % squareSize) + squareSize) % squareSize;
      const startY = -((gridOffset.current.y % squareSize) + squareSize) % squareSize;

      for (let x = startX; x < canvas.width; x += squareSize) {
        for (let y = startY; y < canvas.height; y += squareSize) {
          
          const currentSquareGridX = Math.floor((x + gridOffset.current.x) / squareSize);
          const currentSquareGridY = Math.floor((y + gridOffset.current.y) / squareSize);

          
          if (
            hoveredSquareCoords.current &&
            currentSquareGridX === hoveredSquareCoords.current.gridX &&
            currentSquareGridY === hoveredSquareCoords.current.gridY
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(x, y, squareSize, squareSize);
          }

          ctx.strokeStyle = borderColor;
          ctx.strokeRect(x, y, squareSize, squareSize);
        }
      }

      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.2);
      switch (direction) {
        case 'right':
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed);
          break;
        case 'left':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed);
          break;
        case 'up':
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed);
          break;
        case 'down':
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed);
          break;
        case 'diagonal':
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed);
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed);
          break;
        default:
          break;
      }
      
      
      gridOffset.current.x %= (squareSize * 100); 
      gridOffset.current.y %= (squareSize * 100);

      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const handleMouseMove = event => {
      const rect = canvas.getBoundingClientRect();
      
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      
      const gridX = Math.floor((mouseX + gridOffset.current.x) / squareSize);
      const gridY = Math.floor((mouseY + gridOffset.current.y) / squareSize);

      if (!hoveredSquareCoords.current ||
          hoveredSquareCoords.current.gridX !== gridX ||
          hoveredSquareCoords.current.gridY !== gridY) {
        hoveredSquareCoords.current = { gridX, gridY };
      }
    };

    const handleMouseLeave = () => {
      hoveredSquareCoords.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
      cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        className={`squares-canvas ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0, 
          width: '100%',
          height: '100%'
        }}
      ></canvas>
      <div
        style={{
          position: 'relative',
          zIndex: 1, 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Squares;