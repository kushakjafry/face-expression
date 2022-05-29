// import { OrbitCameraControls, Vector } from "@0xalter/alter-core";
import React, { Suspense, lazy, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Loader from "./Loader";
import {
  ApplicationContext,
  FacemojiAPI,
  FaceTracker,
  Future,
  Nullable,
  Quaternion,
  ResourceFileSystem,
} from "@0xalter/mocap4face";
import ThreeCanvasControls from "./ThreeCanvasControls";
import { getWorldCordinates } from "../../../utils/canvasUtils";
import { faceRotationToBlendshapes } from "../../../utils/avatarUtils";

const CanvasElements = lazy(() => import("./CanvasElements"));

function ThreeCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const asyncTrackerRef = useRef<Future<Nullable<FaceTracker>> | null>(null);
  const [head, setHead] = useState<any>(null);
  const [scene, setScene] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const didMount = useRef(false);
  const rectRef = useRef<HTMLDivElement | null>(null);

  const intialize = () => {
    const context = new ApplicationContext(window.location.href);
    const fs = new ResourceFileSystem(context);
    FacemojiAPI.initialize(
      "e6ciepj4suxtgd6zrxr4x3nlx5xa3cj2yfeip2buc6k7t64ysgwkzsy",
      context
    ).then((activated) => {
      if (activated) console.log("Activated");
      else console.log("Not Activated");
    });

    const asyncTracker = FaceTracker.createVideoTracker(fs)
      .then((tracker) => {
        const blendshapeNames = tracker.blendshapeNames
          .toArray()
          .concat(
            faceRotationToBlendshapes(
              Quaternion.createWithFloat(0, 0, 0, 1)
            ).map((e) => e[0])
          )
          .sort();
        return tracker;
      })
      .logError("Could Not start Recording");
    asyncTrackerRef.current = asyncTracker;
  };

  const startVideo = () => {
    const video = videoRef.current!;
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.autoplay = true;
    });
  };

  const stopVideo = () => {
    const video = videoRef.current!;
    if (video.srcObject !== null) {
      (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
  };

  const track = () => {
    requestAnimationFrame(track);
    if (head == null) return;
    // get coefficients present on head model
    const {
      morphTargetInfluences: influences,
      morphTargetDictionary: morphDict,
    } = head;
    const tracker = asyncTrackerRef.current!.currentValue;
    if (!tracker || !videoRef.current) {
      return;
    }

    // get last results from motion capture video.
    const lastResult = tracker.track(videoRef.current);
    if (lastResult == null) {
      return;
    }

    // find the position of face in 2D and then convert it to 3D canvas world space
    const rect = lastResult.faceRectangle
      .flipY(lastResult.inputImageSize.y)
      .normalizeBy(lastResult.inputImageSize)
      .scale(videoRef.current!.clientWidth, videoRef.current!.clientHeight)
      .scaleAroundCenter(0.8, 0.8);
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const worldPos = getWorldCordinates(
      canvasRef.current!,
      centerX,
      centerY,
      camera
    );
    scene.position.setX(worldPos.x);
    scene.position.setY(worldPos.y);
    scene.position.setZ(0);

    // update the values
    for (const [name, value] of lastResult!.blendshapes) {
      // @ts-ignore
      if (name in morphDict) {
        influences[morphDict[name]] = value;
      }
    }

    const rotationBlendshapes = faceRotationToBlendshapes(
      lastResult.rotationQuaternion
    );
    for (const [name, value] of rotationBlendshapes) {
      if (name in morphDict) {
        influences[morphDict[name]] = value;
      }
    }
  };

  const handleCameraClick = () => {
    setCameraOn(!cameraOn);
  };

  useEffect(() => {
    if (head != null) {
      track();
    }
  }, [head]);

  useEffect(() => {
    if (didMount.current) {
      if (cameraOn) startVideo();
      else stopVideo();
    } else {
      didMount.current = true;
    }
  }, [cameraOn]);

  useEffect(() => {
    intialize();
  }, []);

  return (
    <div className="flex justify-center flex-col items-center min-h-screen">
      <div className="flex w-full h-[100vw] sm:h-[75vw] md:h-[60vw] lg:h-[600px]">
        <div className="hidden sm:flex w-1/12 h-full"></div>
        <div className="flex w-full sm:w-10/12 h-full items-center rounded-md  justify-center">
          <div className="h-full w-1/2 bg-gray-700 relative">
            <Canvas
              ref={canvasRef}
              camera={{ zoom: 30, position: [0, 0, 200] }}
            >
              <Suspense fallback={<Loader />}>
                <CanvasElements
                  setHead={setHead}
                  setScene={setScene}
                  setCamera={setCamera}
                />
              </Suspense>
            </Canvas>
            <ThreeCanvasControls
              handleCameraClick={handleCameraClick}
              cameraOn={cameraOn}
            />
            <div
              className=" border-solid border-2 border-red-200 absolute"
              ref={rectRef}
            ></div>
          </div>
          <div className="h-full w-1/2">
            <video ref={videoRef} controls className="object-cover h-full">
              <source src="m4f.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <div className="hidden sm:flex w-1/12 h-full"></div>
      </div>
    </div>
  );
}

export default ThreeCanvas;
