import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';

const PALETTE = [
  { color: '#ededed', label: 'Bone White' },
  { color: '#6b62f2', label: 'Dusk Violet' },
  { color: '#f59e0b', label: 'Warm Amber' },
  { color: '#3b82f6', label: 'Cobalt Blue' },
  { color: '#10b981', label: 'Soft Emerald' },
  { color: '#f43f5e', label: 'Rose Accent' },
  { color: '#c2c2c2', label: 'Ash Gray' },
  { color: '#0a0a0a', label: 'Void Canvas Eraser' },
];

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#ededed');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [partnerPointer, setPartnerPointer] = useState(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointerTimeoutRef = useRef(null);

  // Setup Canvas & Socket Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const socket = getSocket();
    if (socket) {
      socket.emit('wb:request_state', { roomId });

      const handleRemoteDraw = ({ canvasJSON }) => {
        if (!canvasJSON) return;
        if (canvasJSON.type === 'line') {
          drawLineRaw(
            canvasJSON.x0,
            canvasJSON.y0,
            canvasJSON.x1,
            canvasJSON.y1,
            canvasJSON.color,
            canvasJSON.size
          );
        } else if (canvasJSON.type === 'stamp') {
          drawStampRaw(canvasJSON.x, canvasJSON.y, canvasJSON.emoji);
        }
      };

      const handleState = ({ strokes }) => {
        if (Array.isArray(strokes)) {
          strokes.forEach((stroke) => {
            if (stroke.type === 'line') {
              drawLineRaw(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size);
            } else if (stroke.type === 'stamp') {
              drawStampRaw(stroke.x, stroke.y, stroke.emoji);
            }
          });
        }
      };

      const handleRemotePointer = (data) => {
        setPartnerPointer(data);
        if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
        pointerTimeoutRef.current = setTimeout(() => {
          setPartnerPointer(null);
        }, 3000);
      };

      const handleClear = () => {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      };

      socket.on('wb:update', handleRemoteDraw);
      socket.on('wb:state', handleState);
      socket.on('wb:pointer', handleRemotePointer);
      socket.on('wb:cleared', handleClear);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        socket.off('wb:update', handleRemoteDraw);
        socket.off('wb:state', handleState);
        socket.off('wb:pointer', handleRemotePointer);
        socket.off('wb:cleared', handleClear);
        if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
      };
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [roomId]);

  const drawLineRaw = (x0, y0, x1, y1, strokeColor, size) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  const drawStampRaw = (x, y, emoji) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    setIsDrawing(true);

    const socket = getSocket();
    socket?.emit('wb:pointer', {
      roomId,
      x: coords.x,
      y: coords.y,
      isDrawing: true,
      color,
    });
  };

  const draw = (e) => {
    if (e.cancelable) e.preventDefault();
    const currentPos = getCanvasCoords(e);

    const socket = getSocket();
    socket?.emit('wb:pointer', {
      roomId,
      x: currentPos.x,
      y: currentPos.y,
      isDrawing,
      color,
    });

    if (!isDrawing) return;

    drawLineRaw(
      lastPosRef.current.x,
      lastPosRef.current.y,
      currentPos.x,
      currentPos.y,
      color,
      brushSize
    );

    socket?.emit('wb:draw', {
      roomId,
      canvasJSON: {
        type: 'line',
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: currentPos.x,
        y1: currentPos.y,
        color,
        size: brushSize,
      },
    });

    lastPosRef.current = currentPos;
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
      const socket = getSocket();
      socket?.emit('wb:pointer', {
        roomId,
        x: lastPosRef.current.x,
        y: lastPosRef.current.y,
        isDrawing: false,
        color,
      });
    }
  };

  const sendStamp = (emoji) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = rect.width / 2 + (Math.random() * 80 - 40);
    const y = rect.height / 2 + (Math.random() * 80 - 40);

    drawStampRaw(x, y, emoji);

    const socket = getSocket();
    socket?.emit('wb:draw', {
      roomId,
      canvasJSON: { type: 'stamp', x, y, emoji },
    });
  };

  const clearCanvas = () => {
    if (!window.confirm('Clear the shared canvas for both of you?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const socket = getSocket();
    socket?.emit('wb:clear', { roomId });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-graphite)',
      borderRadius: 'var(--radius-card)', // 24px
      border: '1px solid var(--color-hairline)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'rgba(22, 22, 22, 0.9)',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--accent-violet)' }}>✦</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: 'var(--color-bone)',
                letterSpacing: '-0.02em',
              }}>
                Collaborative Canvas
              </span>
              <span style={{
                fontSize: '0.6875rem',
                padding: '0.15rem 0.6rem',
                borderRadius: 'var(--radius-pill)',
                background: '#1a1a1a',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-ash)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
              }}>
                Live Stream
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              Draw, sketch, and stamp simultaneously in real time
            </span>
          </div>
        </div>

        {/* Color Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {PALETTE.map((p) => (
            <button
              key={p.color}
              onClick={() => setColor(p.color)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: p.color,
                border: color === p.color ? '2px solid var(--color-snow-white)' : '1px solid var(--color-hairline)',
                cursor: 'pointer',
                transform: color === p.color ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform var(--transition-fast)',
              }}
              title={p.label}
            />
          ))}
        </div>

        {/* Controls: Stamps, Slider, Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Stamps */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['❤️', '✨', '🌹', '💋', '⭐'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendStamp(emoji)}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                title={`Stamp ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Size slider */}
          <label style={{ fontSize: '0.75rem', color: 'var(--color-slate)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Size</span>
            <input
              type="range"
              min="2"
              max="24"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ width: 55, accentColor: 'var(--color-snow-white)', cursor: 'pointer' }}
            />
          </label>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              background: '#1a1a1a',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-ash)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'var(--color-void-canvas)', // #0a0a0a
        overflow: 'hidden',
        touchAction: 'none',
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />

        {/* Live Partner Pointer Indicator */}
        {partnerPointer && (
          <div style={{
            position: 'absolute',
            left: partnerPointer.x,
            top: partnerPointer.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'left 60ms linear, top 60ms linear',
            zIndex: 20,
          }}>
            <div style={{
              background: '#161616',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-bone)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              padding: '0.15rem 0.55rem',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontFamily: 'var(--font-mono)',
            }}>
              <span>✦</span>
              <span>{partnerPointer.username || 'Partner'}</span>
            </div>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: partnerPointer.color || 'var(--color-snow-white)',
              marginTop: 2,
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
