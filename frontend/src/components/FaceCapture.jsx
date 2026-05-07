import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCcw } from 'lucide-react'

export default function FaceCapture({ onCapture, label = "Take Photo" }) {
  const webcamRef = useRef(null)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState(null)

  const capture = useCallback(() => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 })
    if (imageSrc) {
      setCaptured(imageSrc)
      onCapture(imageSrc)
    }
  }, [onCapture])

  const retake = () => {
    setCaptured(null)
    onCapture(null)
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video max-w-sm mx-auto">
        {!captured ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              onUserMediaError={() => setError("Camera access denied. Please allow camera permission.")}
              className="w-full h-full object-cover"
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-48 border-2 border-blue-400 border-dashed rounded-full opacity-70"></div>
            </div>
          </>
        ) : (
          <img src={captured} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex justify-center gap-3">
        {!captured ? (
          <button onClick={capture} className="btn-primary flex items-center gap-2" disabled={!!error}>
            <Camera size={18} />
            {label}
          </button>
        ) : (
          <button onClick={retake} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={18} />
            Retake
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Position your face within the oval guide. Ensure good lighting.
      </p>
    </div>
  )
}
