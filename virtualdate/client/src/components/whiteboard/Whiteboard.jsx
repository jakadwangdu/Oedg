import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';

const MONO_PALETTE = [
  { color: '#ffffff', label: 'Pure White' },
  { color: '#bdbdbd', label: 'Light Gray' },
  { color: '#7a7a7a', label: 'Medium Gray' },
  { color: '#454545', label: 'Dark Slate' },
  { color: '#000000', label: 'Eraser (Void)' },
];

const MONO_STAMPS = ['♡', '✦', '☾', '❋', '◌', '✧'];

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#ffffff');
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
          // Partner strokes are dotted
          drawLineRaw(
            canvasJSON.x0,
            canvasJSON.y0,
            canvasJSON.x1,
            canvasJSON.y1,
            canvasJSON.color,
            canvasJSON.size,
            true
          );
        } else if (canvasJSON.type === 'stamp') {
          drawStampRaw(canvasJSON.x, canvasJSON.y, canvasJSON.emoji);
        }
      };

      const handleState = ({ strokes }) => {
        if (Array.isArray(strokes)) {
          strokes.forEach((stroke) => {
            if (stroke.type === 'line') {
              drawLineRaw(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size, false);
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
      };
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [roomId]);

  const drawLineRaw = (x0, y0, x1, y1, strokeColor, size, isDotted = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.setLineDash(isDotted ? [6, 6] : []);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawStampRaw = (x, y, emoji) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const prev = lastPosRef.current;

    // Yours are solid
    drawLineRaw(prev.x, prev.y, pos.x, pos.y, color, brushSize, false);

    const socket = getSocket();
    socket?.emit('wb:draw', {
      roomId,
      canvasJSON: {
        type: 'line',
        x0: prev.x,
        y0: prev.y,
        x1: pos.x,
        y1: pos.y,
        color,
        size: brushSize,
      },
    });

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handlePointerMove = (e) => {
    const pos = getCanvasPos(e);
    const socket = getSocket();
    socket?.emit('wb:pointer', {
      roomId,
      x: pos.x,
      y: pos.y,
    });
  };

  const addStamp = (emoji) => {
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#000',
        borderRadius: 24,
        border: '1px solid var(--line)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--k1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--w)' }}>✦</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: 'var(--w)',
                  letterSpacing: '-0.02em',
                }}
              >
                Collaborative Canvas
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: 999,
                  background: 'var(--k3)',
                  border: '1px solid var(--line)',
                  color: 'var(--w2)',
                }}
              >
                You: solid &middot; Teammate: dotted
              </span>
            </div>
          </div>
        </div>

        {/* 4-Shade Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {MONO_PALETTE.map((p) => (
            <button
              key={p.color}
              onClick={() => setColor(p.color)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: p.color,
                border: color === p.color ? '2px solid var(--w)' : '1px solid var(--line)',
                cursor: 'pointer',
                transform: color === p.color ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
              title={p.label}
            />
          ))}
        </div>

        {/* Glyph Stamps & Brush Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {MONO_STAMPS.map((glyph) => (
              <button
                key={glyph}
                onClick={() => addStamp(glyph)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  color: 'var(--w)',
                  fontSize: '0.9rem',
                  padding: '0.2rem 0.45rem',
                  cursor: 'pointer',
                }}
                title="Stamp glyph"
              >
                {glyph}
              </button>
            ))}
          </div>

          <button
            onClick={clearCanvas}
            className="pill-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={(e) => {
            draw(e);
            handlePointerMove(e);
          }}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Partner Outlined Pointer Cursor */}
        {partnerPointer && (
          <div
            style={{
              position: 'absolute',
              left: partnerPointer.x,
              top: partnerPointer.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid var(--w)',
                background: 'transparent',
              }}
            />
            <span
              className="mono"
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid var(--line)',
                fontSize: 10,
                color: 'var(--w1)',
              }}
            >
              Teammate
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
