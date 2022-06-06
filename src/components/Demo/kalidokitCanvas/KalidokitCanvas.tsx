import React, { Suspense, useEffect, useRef, useState } from "react";
import { Face, Pose, Hand, Vector } from "kalidokit";
import { Canvas } from "@react-three/fiber";
import KalidokitCanvasElements from "./KalidokitCanvasElements";
import * as faceapi from "face-api.js";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import { Euler } from "three";
import Loader from "../threeCanvas/Loader";
import { animateVRM, onExpressionDetection } from "./VRMUtils";
import ThreeCanvasControls from "../threeCanvas/ThreeCanvasControls";
import KalidokitCameraControls from "./KalidokitCameraControls";
import { Holistic } from "@mediapipe/holistic";

function KalidokitCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const [VRM_1, setVRM] = useState<VRM | null>(null);
  const oldLookTarget = useRef(new Euler());
  const holisticRef = useRef<Holistic | null>(null);
  const [stream, setStream] = useState<any>(null);
  const [timer, setTimer] = useState<
    string | number | NodeJS.Timeout | undefined
  >();

  const onResults = (results) => {
    animateVRM(VRM_1!, results, videoRef.current!, oldLookTarget);
  };

  const startVideo = () => {
    (navigator as any).getUserMedia(
      { video: {} },
      (stream) => {
        setStream(stream);
      },
      (err) => console.log(err)
    );
  };

  const stopVideo = () => {
    console.log("stop video");
    stream.getTracks()[0].stop();
    setStream(null);
  };

  const toggleVideo = () => {
    if (!stream) {
      startVideo();
    } else {
      stopVideo();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream) {
        video.srcObject = stream;
        video.play();
      } else {
        clearInterval(timer);
        setTimer(undefined);
        video.poster = "/images/thumbnail.png";
        video.pause();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  const initializeHolistic = async (holistic) => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/faceAPIModels"),
      faceapi.nets.faceExpressionNet.loadFromUri("/faceAPIModels"),
      holistic.initialize(),
    ]).then(() => {
      holisticRef.current! = holistic;
    });
  };

  useEffect(() => {
    if (VRM_1) {
      const holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        },
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        refineFaceLandmarks: true,
      });
      holistic.onResults((results) => {
        onResults(results);
      });
      initializeHolistic(holistic);
    }
  }, [VRM_1]);

  const handleVideoPlay = () => {
    let timer = setInterval(async () => {
      const holistic = holisticRef.current!;
      const holisticPromise = holistic.send({ image: videoRef.current! });
      const faceApiPromise = faceapi
        .detectSingleFace(
          videoRef.current!,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceExpressions();
      const [_1, detections] = await Promise.all([
        holisticPromise,
        faceApiPromise,
      ]);
      if (detections) {
        const currentEmotions = detections.expressions.asSortedArray();
        onExpressionDetection(currentEmotions, VRM_1!);
      }
    }, 200);
    setTimer(timer);
  };

  return (
    <div className="flex justify-center flex-col items-center min-h-screen">
      <div className="flex w-full h-[100vw] sm:h-[75vw] md:h-[60vw] lg:h-[600px]">
        <div className="hidden sm:flex w-1/12 h-full"></div>
        <div className="flex w-full sm:w-10/12 h-full items-center rounded-md  justify-center">
          <div className="h-full w-1/2 bg-gray-700 relative">
            <Canvas
              ref={canvasRef}
              camera={{ zoom: 100, position: [0, 0, 50] }}
            >
              <Suspense fallback={<Loader />}>
                {/* <CanvasElements/> */}
                <KalidokitCanvasElements vrm={VRM_1} setVRM={setVRM} />
              </Suspense>
            </Canvas>
            <KalidokitCameraControls
              handleCameraClick={toggleVideo}
              stream={stream}
            />
          </div>
          <div className="h-full w-1/2 relative">
            <video
              ref={videoRef}
              className={`object-cover h-full ${stream ? "-scale-x-100" : ""}`}
              onPlay={handleVideoPlay}
              loop
              poster="/images/thumbnail.png"
            >
              <source type="video/mp4" />
            </video>
            <canvas
              ref={canvas2Ref}
              className="absolute w-full h-full z-20 bg-transparent top-0 left-0"
              style={{
                transform: "scaleX(-1)",
              }}
            />
          </div>
        </div>
        <div className="hidden sm:flex w-1/12 h-full"></div>
      </div>
    </div>
  );
}

export default KalidokitCanvas;
