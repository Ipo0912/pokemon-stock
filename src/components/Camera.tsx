"use client";

import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: "environment",
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageBase64 = webcamRef.current.getScreenshot();
      setImageSrc(imageBase64);
      console.log("Photo capturée (Base64) !");
    }
  }, [webcamRef]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {!imageSrc ? (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-4 border-slate-700 shadow-xl">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-auto object-cover"
            />
          </div>
          <button
            onClick={capture}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
          >
            Scanner la carte
          </button>
        </>
      ) : (
        <>
          <img
            src={imageSrc}
            alt="Carte capturée"
            className="w-full max-w-sm rounded-2xl border-4 border-green-500 shadow-xl"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setImageSrc(null)}
              className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
            >
              Reprendre
            </button>
            <button className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-all">
              Analyser
            </button>
          </div>
        </>
      )}
    </div>
  );
}
