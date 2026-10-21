"use client";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

let loading: Promise<typeof import("@vladmandic/face-api")> | null = null;

async function nets() {
  if (!loading) {
    loading = import("@vladmandic/face-api").then(async (faceapi) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    });
  }
  return loading;
}

export async function extractFaceDescriptor(dataUrl: string) {
  try {
    const faceapi = await nets();
    const img = await faceapi.fetchImage(dataUrl);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection ? Array.from(detection.descriptor) : null;
  } catch {
    return null;
  }
}
