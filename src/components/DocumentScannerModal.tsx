import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Maximize2,
  Check,
  X,
  RotateCw,
  Sliders,
  CheckCircle2,
  FileText,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  scanAndAutoResizeDocument,
  scanDocumentWithAI,
  inspectImageMetadata,
  DocumentAspectPreset,
  getFormattingPresetLabel,
  ImageMetadata,
  AIScanResult,
  ScanAndResizeResult,
} from '../utils/imageScanner';
import { PartnerRecord } from '../types';

interface DocumentScannerModalProps {
  isOpen: boolean;
  partner: PartnerRecord;
  targetSlot: 'idFront' | 'idBack' | 'tinCertificate';
  initialImageSrc: string;
  onClose: () => void;
  onApply: (params: {
    slot: 'idFront' | 'idBack' | 'tinCertificate';
    resizedDataUrl: string;
    extractedData?: AIScanResult['extractedData'];
  }) => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  partner,
  targetSlot,
  initialImageSrc,
  onClose,
  onApply,
}) => {
  const [imageSrc, setImageSrc] = useState(initialImageSrc);
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [aiScanResult, setAiScanResult] = useState<AIScanResult | null>(null);
  const [resizeResult, setResizeResult] = useState<ScanAndResizeResult | null>(null);

  // Resize controls
  const [preset, setPreset] = useState<DocumentAspectPreset>(
    targetSlot === 'tinCertificate' ? 'cert' : 'id'
  );
  const [rotation, setRotation] = useState(0);
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [fillMode, setFillMode] = useState<'fill' | 'fit'>('fill');

  const [activeTab, setActiveTab] = useState<'preview' | 'extracted'>('preview');

  const slotTitle =
    targetSlot === 'tinCertificate'
      ? 'GRA TIN Certificate'
      : targetSlot === 'idBack'
      ? 'Identity Card Back'
      : 'Identity Card Front / Bio-Page';

  // Load metadata and trigger auto-resizing on mount
  useEffect(() => {
    if (!initialImageSrc) return;
    setImageSrc(initialImageSrc);

    inspectImageMetadata(initialImageSrc)
      .then((meta) => {
        setMetadata(meta);
        if (targetSlot === 'tinCertificate') {
          setPreset(meta.detectedFormat === 'certPortrait' ? 'certPortrait' : 'cert');
        } else {
          setPreset(meta.detectedFormat === 'passport' ? 'passport' : 'id');
        }
      })
      .catch((err) => console.warn('Metadata inspect error:', err));
  }, [initialImageSrc, targetSlot]);

  // Re-run auto-resizing whenever controls change
  useEffect(() => {
    if (!imageSrc) return;
    setIsResizing(true);
    scanAndAutoResizeDocument(imageSrc, targetSlot, {
      forcedPreset: preset,
      straightenRotation: rotation,
      enhanceContrast,
      fillMode,
    })
      .then((res) => {
        setResizeResult(res);
      })
      .catch((err) => console.error('Resize error:', err))
      .finally(() => setIsResizing(false));
  }, [imageSrc, targetSlot, preset, rotation, enhanceContrast, fillMode]);

  // Trigger AI Scan
  const handleTriggerAIScan = async () => {
    if (!imageSrc) return;
    setIsScanningAI(true);
    try {
      const result = await scanDocumentWithAI(imageSrc, targetSlot);
      setAiScanResult(result);
      if (result.suggestedRotation && result.suggestedRotation !== 0) {
        setRotation(result.suggestedRotation);
      }
      if (result.recommendedAspectPreset && result.recommendedAspectPreset !== 'free') {
        setPreset(result.recommendedAspectPreset);
      }
      setActiveTab('extracted');
    } catch (err) {
      console.error('AI Scan error:', err);
    } finally {
      setIsScanningAI(false);
    }
  };

  const handleApply = () => {
    const finalUrl = resizeResult?.dataUrl || imageSrc;
    onApply({
      slot: targetSlot,
      resizedDataUrl: finalUrl,
      extractedData: aiScanResult?.extractedData,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/90 text-white flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-wide text-white">
                  Document Scanner &amp; Auto-Resizer
                </h3>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-semibold">
                  {slotTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-sizes to exact formatting standard without reducing quality • Partner:{' '}
                <span className="text-white font-medium">{partner.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Bar with tabs and 1-Click AI Scan button */}
        <div className="bg-slate-800 border-b border-slate-700/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Visual Auto-Resizing &amp; Framing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('extracted')}
              className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'extracted'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>AI Scanned Data</span>
              {aiScanResult && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerAIScan}
              disabled={isScanningAI}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold shadow-xs transition"
            >
              {isScanningAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Document with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Scan with AI &amp; Extract Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 flex flex-col md:flex-row gap-5">
          {activeTab === 'preview' ? (
            <>
              {/* Left / Main: High-Def Resized Preview Canvas */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-slate-950 rounded-xl p-3 shadow-inner flex flex-col items-center border border-slate-800">
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      Auto-Resized Preview (Edge-to-Edge Window Fit)
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px]">
                      {resizeResult
                        ? `${resizeResult.targetWidth} × ${resizeResult.targetHeight} px (Lossless Quality)`
                        : 'Processing...'}
                    </span>
                  </div>

                  <div className="w-full min-h-[300px] max-h-[440px] flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden border border-slate-700/60 p-2">
                    {isResizing ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                        <span className="text-xs">Applying high-order bicubic scaling...</span>
                      </div>
                    ) : resizeResult ? (
                      <img
                        src={resizeResult.dataUrl}
                        alt="Auto-Resized Preview"
                        className="max-h-[400px] max-w-full object-contain rounded shadow-lg border border-slate-700 bg-white"
                      />
                    ) : (
                      <img
                        src={imageSrc}
                        alt="Source"
                        className="max-h-[400px] max-w-full object-contain"
                      />
                    )}
                  </div>

                  {resizeResult && (
                    <div className="w-full mt-2.5 px-2 py-1.5 bg-slate-900/90 rounded border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">{resizeResult.qualityNote}</span>
                      <span className="font-mono text-slate-400">
                        {resizeResult.fileSizeBefore} &rarr;{' '}
                        <strong className="text-blue-300">{resizeResult.fileSizeAfter}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Sizing & Formatting Toolbar */}
                <div className="w-full mt-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Formatting Preset Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-700 text-[11px]">Format Preset:</span>
                      <button
                        type="button"
                        onClick={() => setPreset('id')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          preset === 'id'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ID Card (85:54)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset('passport')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          preset === 'passport'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Passport (1.42:1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset('cert')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          preset === 'cert'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Certificate Landscape (GRA)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset('certPortrait')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          preset === 'certPortrait'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Certificate Portrait (A4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset('free')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          preset === 'free'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Natural Bounds
                      </button>
                    </div>

                    {/* Secondary Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Rotate {rotation !== 0 ? `(${rotation}°)` : '90°'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnhanceContrast(!enhanceContrast)}
                        className={`px-2.5 py-1.5 rounded font-semibold text-xs flex items-center gap-1 transition ${
                          enhanceContrast
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Auto-Contrast
                      </button>

                      <button
                        type="button"
                        onClick={() => setFillMode(fillMode === 'fill' ? 'fit' : 'fill')}
                        className={`px-2.5 py-1.5 rounded font-semibold text-xs flex items-center gap-1 transition ${
                          fillMode === 'fill'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {fillMode === 'fill' ? 'Fill Frame' : 'Fit Entire'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Inspection & Quality Details */}
              <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
                {/* Document Information Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      File &amp; Format Inspection
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Detected Format:</span>
                      <span className="font-semibold text-slate-800">
                        {metadata ? getFormattingPresetLabel(preset) : 'Detecting...'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Original Size:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {metadata ? `${metadata.width} × ${metadata.height}` : '...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">File Size:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {metadata?.formattedSize || '...'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Resized Target:</span>
                        <span className="font-mono font-semibold text-blue-700">
                          {resizeResult
                            ? `${resizeResult.targetWidth} × ${resizeResult.targetHeight}`
                            : '...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Aspect Ratio:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {resizeResult ? `${resizeResult.detectedAspect.toFixed(2)}:1` : '...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Scan Status Card */}
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Document Analysis</span>
                  </div>

                  {aiScanResult ? (
                    <div className="space-y-1.5 text-blue-900 text-[11px]">
                      <p className="font-semibold text-slate-900">
                        {aiScanResult.documentTitle}
                      </p>
                      <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-blue-200">
                        <span>Quality Score:</span>
                        <strong className="text-emerald-700 font-mono">
                          {aiScanResult.qualityAssessment.score}/100 •{' '}
                          {aiScanResult.qualityAssessment.sharpness}
                        </strong>
                      </div>
                      <p className="text-slate-600">{aiScanResult.summary}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('extracted')}
                        className="w-full mt-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        View Scanned Fields
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-blue-900/90 text-[11px] leading-relaxed">
                        Click &ldquo;Scan with AI&rdquo; to extract identity numbers, names, dates,
                        and verify document seals directly from this image.
                      </p>
                      <button
                        type="button"
                        onClick={handleTriggerAIScan}
                        disabled={isScanningAI}
                        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        {isScanningAI ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Run AI Scan Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* AI Scanned Extracted Data Tab */
            <div className="w-full bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    AI Extracted Document Fields
                  </h4>
                  <p className="text-xs text-slate-500">
                    Values extracted strictly from the scanned image with zero manual typing
                  </p>
                </div>
                {aiScanResult && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Quality Score: {aiScanResult.qualityAssessment.score}%
                  </span>
                )}
              </div>

              {aiScanResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {aiScanResult.extractedData.fullName && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Full Name
                        </span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                          {aiScanResult.extractedData.fullName}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.idNumber && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          ID / Document Number
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                          {aiScanResult.extractedData.idNumber}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.tinNumber && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          TIN Number
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                          {aiScanResult.extractedData.tinNumber}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.dateOfBirth && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Date of Birth
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.dateOfBirth}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.nationality && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Nationality
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.nationality}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.taxOffice && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Tax Office
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.taxOffice}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.issueDate && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Issue Date
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.issueDate}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.expiryDate && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Expiry Date
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.expiryDate}
                        </span>
                      </div>
                    )}

                    {aiScanResult.extractedData.taxpayerName && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Taxpayer Name
                        </span>
                        <span className="font-medium text-slate-900 mt-0.5 block">
                          {aiScanResult.extractedData.taxpayerName}
                        </span>
                      </div>
                    )}
                  </div>

                  {aiScanResult.extractedData.otherDetails.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        Additional Document Details:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {aiScanResult.extractedData.otherDetails.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between"
                          >
                            <span className="text-slate-500">{item.label}:</span>
                            <span className="font-medium text-slate-900 text-right">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Applying will synchronize these verified fields directly into{' '}
                      <strong>{partner.name}</strong>&rsquo;s Company Partner Profile dossier.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-xs">No scan data yet. Click below to run AI scanning.</p>
                  <button
                    type="button"
                    onClick={handleTriggerAIScan}
                    disabled={isScanningAI}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    {isScanningAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Run AI Scan on Document</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply Auto-Resized Image &amp; Sync Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
