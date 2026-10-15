import React, { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle2, Clipboard, Crop, RefreshCw, Maximize2, Loader2 } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { scanAndAutoResizeDocument } from '../utils/imageScanner';

interface ImageUploadBoxProps {
  label: string;
  sublabel: string;
  badgeText: string;
  image: string | null;
  onImageChange: (dataUrl: string | null) => void;
  required?: boolean;
}

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  label,
  sublabel,
  badgeText,
  image,
  onImageChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Crop modal state
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleRawFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingImageSrc(e.target.result as string);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRawFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setPendingImageSrc(e.target.result as string);
              setIsCropModalOpen(true);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      alert('No image found in clipboard. Please copy an image first.');
    } catch {
      alert('Unable to access clipboard. Please use file upload or drag & drop.');
    }
  };

  const handleAutoResize = async () => {
    if (!image) return;
    setIsResizing(true);
    try {
      const res = await scanAndAutoResizeDocument(image, attachmentType, { fillMode: 'fill' });
      onImageChange(res.dataUrl);
    } catch (err) {
      console.error('Auto-resize error:', err);
    } finally {
      setIsResizing(false);
    }
  };

  const attachmentType = label.toLowerCase().includes('tin')
    ? 'tinCertificate'
    : label.toLowerCase().includes('back')
    ? 'idBack'
    : 'idFront';

  return (
    <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            {label}
          </span>
          <p className="text-[11px] text-slate-500">{sublabel}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold">
          {badgeText}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleRawFile(e.target.files[0]);
          }
        }}
      />

      {image ? (
        <div className="relative group rounded border border-slate-300 bg-white p-2 overflow-hidden flex flex-col items-center">
          <div className="w-full h-44 flex items-center justify-center bg-slate-900/5 rounded overflow-hidden p-1">
            <img
              src={image}
              alt={label}
              className="w-full h-full object-contain object-center"
            />
          </div>
          <div className="w-full mt-2 flex items-center justify-between text-xs pt-1">
            <div className="flex items-center text-emerald-700 font-medium text-[11px] gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Attached</span>
            </div>
            <div className="flex items-center gap-1">
              {/* 1-Click Auto-Resize to formatting */}
              <button
                type="button"
                onClick={handleAutoResize}
                disabled={isResizing}
                className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 bg-blue-50/60 border border-blue-200 rounded flex items-center gap-1 transition"
                title="Auto-resize to standard document aspect ratio without quality reduction"
              >
                {isResizing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <Maximize2 className="w-3 h-3 text-blue-600" />
                )}
                Auto-Fit
              </button>
              {/* Re-crop current image */}
              <button
                type="button"
                onClick={() => {
                  setPendingImageSrc(image);
                  setIsCropModalOpen(true);
                }}
                className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded flex items-center gap-1"
                title="Crop or rotate current image"
              >
                <Crop className="w-3 h-3" />
                Adjust
              </button>
              {/* Replace with new image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded flex items-center gap-1"
                title="Select new image to crop and replace"
              >
                <RefreshCw className="w-3 h-3" />
                Replace
              </button>
              <button
                type="button"
                onClick={() => onImageChange(null)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-44 border-2 border-dashed rounded cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-colors ${
            isDragging
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-300 hover:border-blue-500 hover:bg-white'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center mb-2">
            <Upload className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Click to upload or drag &amp; drop
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Opens crop &amp; adjustment window before upload
          </p>
          <div className="mt-2.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handlePaste}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition"
            >
              <Clipboard className="w-3 h-3" />
              Paste from clipboard
            </button>
          </div>
        </div>
      )}

      {/* Interactive Crop & Adjustment Modal before replacement */}
      {isCropModalOpen && pendingImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={pendingImageSrc}
          currentAttachmentSrc={image}
          title={`Crop & Adjust: ${label}`}
          attachmentType={attachmentType}
          onConfirm={(croppedUrl) => {
            onImageChange(croppedUrl);
            setIsCropModalOpen(false);
            setPendingImageSrc(null);
          }}
          onCancel={() => {
            setIsCropModalOpen(false);
            setPendingImageSrc(null);
          }}
        />
      )}
    </div>
  );
};
