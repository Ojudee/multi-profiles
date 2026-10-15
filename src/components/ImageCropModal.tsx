import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  FlipHorizontal,
  Crop,
  Layers,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string; // The selected raw image
  currentAttachmentSrc?: string | null;
  title: string;
  attachmentType: 'idFront' | 'idBack' | 'tinCertificate';
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  currentAttachmentSrc,
  title,
  attachmentType,
  onConfirm,
  onCancel,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [isFlipped, setIsFlipped] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'id' | 'cert' | 'certPortrait' | 'free'>(
    attachmentType === 'tinCertificate' ? 'cert' : 'id'
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    setLoadError(null);
    const img = new Image();
    // Only set crossOrigin for external http(s) URLs, not data: or blob: URIs
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setRotation(0);
      setIsFlipped(false);
      setPan({ x: 0, y: 0 });
      drawCanvas();
    };
    img.onerror = () => {
      setLoadError('Failed to decode the image. Please verify file format.');
    };
    img.src = imageSrc;
  }, [imageSrc, aspectRatio]);

  // Redraw when controls change
  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, isFlipped, pan, aspectRatio]);

  const getTargetDimensions = () => {
    if (aspectRatio === 'id') {
      return { width: 1700, height: 1080 }; // Standard ID card 1.57:1 at 2x crisp HD
    } else if (aspectRatio === 'cert') {
      return { width: 1880, height: 1280 }; // Certificate Landscape 1.47:1 at 2x crisp HD
    } else if (aspectRatio === 'certPortrait') {
      return { width: 1240, height: 1760 }; // Certificate Portrait A4 1:1.41 at 2x crisp HD
    }
    return { width: 1600, height: 1200 };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: targetW, height: targetH } = getTargetDimensions();
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.save();

    // Center of canvas
    ctx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flip
    if (isFlipped) {
      ctx.scale(-1, 1);
    }

    // Apply zoom
    ctx.scale(zoom, zoom);

    // Draw image to fill target canvas dimensions (cover mode so image fills the window)
    const imgAspect = img.width / img.height;
    const canvasAspect = targetW / targetH;

    let drawW: number;
    let drawH: number;

    // Fill completely (cover) instead of leaving empty white margins (contain)
    if (imgAspect > canvasAspect) {
      drawH = targetH;
      drawW = targetH * imgAspect;
    } else {
      drawW = targetW;
      drawH = targetW / imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
    onConfirm(croppedUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">{title}</h3>
              <p className="text-[11px] text-slate-400">
                Crop, rotate, and adjust image before replacing the attachment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col md:flex-row gap-5 bg-slate-50">
          {/* Main Interactive Crop Preview Canvas */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full bg-slate-900 rounded-lg p-3 flex flex-col items-center shadow-inner relative overflow-hidden">
              <span className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-blue-400" />
                Drag to reposition • Use controls below to zoom or rotate
              </span>

              <div className="w-full flex items-center justify-center min-h-[320px] max-h-[420px] overflow-hidden rounded border border-slate-700 bg-slate-950">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  className="max-w-full max-h-[380px] object-contain cursor-grab active:cursor-grabbing border border-blue-500/60 shadow-lg touch-none"
                />
              </div>
            </div>

            {loadError && (
              <div className="w-full mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs flex items-center justify-between">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => setLoadError(null)}
                  className="text-red-700 hover:text-red-900 font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Adjustments Tool Bar */}
            <div className="w-full mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
              {/* Zoom & Rotate Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(0.6, parseFloat((prev - 0.1).toFixed(2))))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.6"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, parseFloat((prev + 0.1).toFixed(2))))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-700 text-[11px] w-12 text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate 90°
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    Flip
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setRotation(0);
                      setIsFlipped(false);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium"
                  >
                    Reset Fit
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-600 shrink-0">Crop Frame:</span>
                <button
                  type="button"
                  onClick={() => setAspectRatio('id')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    aspectRatio === 'id'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ID Card (85:54)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('cert')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    aspectRatio === 'cert'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Certificate Landscape (GRA)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('certPortrait')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    aspectRatio === 'certPortrait'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Certificate Portrait (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('free')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    aspectRatio === 'free'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Free (4:3)
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Before vs After Comparison */}
          <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Current Attachment:
              </span>
              {currentAttachmentSrc ? (
                <div className="h-28 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={currentAttachmentSrc}
                    alt="Current"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                  No existing attachment
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <p className="font-semibold text-blue-950 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                Pre-Upload Verification
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Check that the partner name, document numbers, dates, and official seals remain clearly legible in the frame before confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            Apply &amp; Replace Attachment
          </button>
        </div>
      </div>
    </div>
  );
};
