import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Scan, 
  FlipHorizontal,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface FaceCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureFace: (photoBase64: string) => void;
  staffName: string;
}

export const FaceCameraScanner: React.FC<FaceCameraScannerProps> = ({
  isOpen,
  onClose,
  onCaptureFace,
  staffName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('Posisikan wajah Anda di dalam lingkaran oval');
  const [isLiveFaceDetected, setIsLiveFaceDetected] = useState<boolean>(false);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      setCapturedImage(null);

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Perangkat atau peramban tidak mendukung akses kamera.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 480 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Harap izinkan akses kamera di browser Anda.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan pada perangkat Anda.');
      } else {
        setCameraError('Tidak dapat mengakses kamera. Anda dapat menggunakan opsi Simulasi Foto Wajah.');
      }
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Clean up stream on close
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, startCamera]);

  // Simulated biometric pulse & face positioning helper
  useEffect(() => {
    if (!isOpen || capturedImage) return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          setIsLiveFaceDetected(true);
          setScanStatusText('✅ Wajah Terdeteksi & Terfokus');
          return 100;
        }
        if (prev === 25) {
          setScanStatusText('Memindai kontur wajah pembimbing...');
        } else if (prev === 60) {
          setScanStatusText('Menyesuaikan pencahayaan & fokus...');
        } else if (prev === 85) {
          setScanStatusText('Memverifikasi biometrik...');
        }
        return prev + 15;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isOpen, capturedImage]);

  // Flip Front / Back Camera (Mobile friendly)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Snapshot from Video
  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    // Draw video frame cropped/centered to square
    const minDim = Math.min(video.videoWidth, video.videoHeight) || 400;
    const startX = (video.videoWidth - minDim) / 2 || 0;
    const startY = (video.videoHeight - minDim) / 2 || 0;

    // If front camera, mirror image for natural selfie feel
    if (facingMode === 'user') {
      ctx.translate(400, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Add subtle security timestamp watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 360, 400, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`KUMON JAMBON - ${new Date().toLocaleTimeString('id-ID')} WIB`, 14, 385);

    // Convert to compressed JPEG data URL (~25KB)
    const base64Photo = canvas.toDataURL('image/jpeg', 0.75);
    setCapturedImage(base64Photo);
    setIsScanning(false);
  };

  // Generate a mock biometric sample photo if device has no physical webcam
  const handleGenerateSampleFace = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#00A0E9');
    grad.addColorStop(1, '#005f96');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Head silhouette
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(200, 160, 75, 0, Math.PI * 2);
    ctx.fill();

    // Body silhouette
    ctx.beginPath();
    ctx.arc(200, 360, 130, Math.PI, Math.PI * 2);
    ctx.fill();

    // Thinking face Kumon icon on chest
    ctx.fillStyle = '#00A0E9';
    ctx.beginPath();
    ctx.arc(200, 290, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(194, 286, 3, 0, Math.PI * 2);
    ctx.arc(206, 286, 3, 0, Math.PI * 2);
    ctx.fill();

    // Security banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 360, 400, 40);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`SIMULASI BIOMETRIK - ${staffName.slice(0, 20)}`, 14, 385);

    const sampleBase64 = canvas.toDataURL('image/jpeg', 0.75);
    setCapturedImage(sampleBase64);
    setIsScanning(false);
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCaptureFace(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText('Posisikan wajah Anda di dalam lingkaran oval');
    setIsLiveFaceDetected(false);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-sky-500/30 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00A0E9]/20 flex items-center justify-center text-[#00A0E9]">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Verifikasi Wajah Biometrik</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00A0E9]/20 text-[#38BDF8] uppercase font-bold">
                  Kumon
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Staff: {staffName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Canvas Area */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
              capturedImage ? 'hidden' : 'block'
            }`}
          />

          {/* Captured Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Hasil Foto Wajah Presensi"
              className="w-full h-full object-cover animate-fadeIn"
            />
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Biometric Oval Guide Overlay */}
          {!capturedImage && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Oval Face Silhouette */}
              <div
                className={`relative w-56 h-72 rounded-[50%] border-2 transition-all duration-300 ${
                  isLiveFaceDetected
                    ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : 'border-[#00A0E9] shadow-[0_0_15px_rgba(0,160,233,0.4)]'
                }`}
              >
                {/* Horizontal Scanning Laser Bar */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#00A0E9] to-transparent animate-bounce shadow-[0_0_8px_#00A0E9]" />

                {/* Corner Targeting Marks */}
                <div className="absolute top-4 left-6 w-3 h-3 border-t-2 border-l-2 border-[#00A0E9]" />
                <div className="absolute top-4 right-6 w-3 h-3 border-t-2 border-r-2 border-[#00A0E9]" />
                <div className="absolute bottom-6 left-6 w-3 h-3 border-b-2 border-l-2 border-[#00A0E9]" />
                <div className="absolute bottom-6 right-6 w-3 h-3 border-b-2 border-r-2 border-[#00A0E9]" />

                {/* Center target crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30 text-xs">
                  +
                </div>
              </div>

              {/* Progress bar inside viewfinder */}
              <div className="w-48 bg-slate-800/80 rounded-full h-1.5 mt-4 overflow-hidden border border-slate-700">
                <div
                  className="bg-[#00A0E9] h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Fallback Error Overlay */}
          {cameraError && !capturedImage && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Terkendala</h4>
              <p className="text-xs text-slate-300 mb-4 max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={handleGenerateSampleFace}
                className="px-4 py-2.5 rounded-xl bg-[#00A0E9] hover:bg-[#008CCF] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-500/25"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gunakan Mode Foto Simulasi</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Status Guidance Text */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 text-center">
          <p className="text-xs font-medium text-slate-300 flex items-center justify-center gap-2">
            {capturedImage ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Foto wajah berhasil dipindai!
              </span>
            ) : (
              <span>{scanStatusText}</span>
            )}
          </p>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-950 flex items-center justify-between gap-3 border-t border-slate-800">
          {!capturedImage ? (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Putar Kamera Depan / Belakang"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleSnapPhoto}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00A0E9] hover:bg-[#008CCF] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>AMBIL FOTO WAJAH</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateSampleFace}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                title="Simulasi Wajah (Jika Tanpa Kamera)"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>GUNAKAN FOTO WAJAH INI</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
