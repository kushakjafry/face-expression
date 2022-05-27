// import { OrbitCameraControls, Vector } from "@0xalter/alter-core";
import React, { Suspense, lazy, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Loader from "./Loader";
import {
  ApplicationContext,
  FacemojiAPI,
  FaceTracker,
  FaceTrackerResultDeserializer,
  FaceTrackerResultSerializer,
  FPS,
  Future,
  Logger,
  LogLevel,
  Nullable,
  Quaternion,
  ResourceFileSystem,
  Vec2,
} from "@0xalter/mocap4face";
import ThreeCanvasControls from "./ThreeCanvasControls";
import { Vector3 } from "three";

const CanvasElements = lazy(() => import("./CanvasElements"));

function ThreeCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const asyncTrackerRef = useRef<Future<Nullable<FaceTracker>> | null>(null);
  const [head, setHead] = useState<any>(null);
  const [scene, setScene] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const didMount = useRef(false);
  const initialInfluencesRef = useRef<number[]>([]);
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
        console.log("tracking");
        const blendshapeNames = tracker.blendshapeNames
          .toArray()
          .concat(
            faceRotationToBlendshapes(
              Quaternion.createWithFloat(0, 0, 0, 1)
            ).map((e) => e[0])
          )
          .sort();
        console.log("here");
        return tracker;
      })
      .logError("Could Not start Recording");
    asyncTrackerRef.current = asyncTracker;
  };

  function faceRotationToBlendshapes(
    rotation: Quaternion
  ): Array<[string, number]> {
    let euler = rotation.toEuler();
    let halfPi = Math.PI * 0.5;
    return [
      ["headLeft", Math.max(0, euler.y) / halfPi],
      ["headRight", -Math.min(0, euler.y) / halfPi],
      ["headUp", -Math.min(0, euler.x) / halfPi],
      ["headDown", Math.max(0, euler.x) / halfPi],
      ["headRollLeft", -Math.min(0, euler.z) / halfPi],
      ["headRollRight", Math.max(0, euler.z) / halfPi],
    ];
  }

  const startVideo = () => {
    const video = videoRef.current!;
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.autoplay = true;
    });
  };

  const stopVideo = () => {
    const video = videoRef.current!;
    const { morphTargetInfluences: influences } = head;
    const initialInfluences = initialInfluencesRef.current;
    for (let i = 0; i < initialInfluences.length; i++) {
      influences[i] = initialInfluences[i];
    }
    if (video.srcObject !== null) {
      (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (head != null) {
      track();
    }
  }, [head]);

  const track = () => {
    requestAnimationFrame(track);
    if (head == null) return;
    const {
      morphTargetInfluences: influences,
      morphTargetDictionary: morphDict,
    } = head;
    if (initialInfluencesRef.current.length === 0) {
      initialInfluencesRef.current = [...influences];
    }
    const tracker = asyncTrackerRef.current!.currentValue;
    if (!tracker || !videoRef.current) {
      return;
    }

    const lastResult = tracker.track(videoRef.current);
    if (lastResult == null) {
      return;
    }

    // const rect = lastResult.faceRectangle
    //   .flipY(lastResult.inputImageSize.y)
    //   .normalizeBy(lastResult.inputImageSize)
    //   .scale(videoRef.current!.clientWidth, videoRef.current!.clientHeight)
    //   .scaleAroundCenter(0.8, 0.8);
    // let faceRectangleElement = rectRef.current!;
    // faceRectangleElement.style.left = rect.x.toString() + "px";
    // faceRectangleElement.style.top = rect.y.toString() + "px";
    // faceRectangleElement.style.width = rect.width.toString() + "px";
    // faceRectangleElement.style.height = rect.height.toString() + "px";

    // const vector = new Vector3();
    // const position = new Vector3();

    // const canvasWidth = (rect.x - 633 / 2) / 633;
    // const canvasHeight = (rect.x - 600 / 2) / 600;
    // vector.set((rect.x / 633) * 2 - 1, -(rect.y / 600) * 2 + 1, 0.5);
    // vector.unproject(camera);
    // vector.sub(camera.position).normalize();
    // let distance = -camera.position.z / vector.z;
    // position.copy(camera.position).add(vector.multiplyScalar(distance));
    // console.log(position, vector);
    // scene.position.setX(position.x);
    // scene.position.setY(position.y);
    // scene.position.setZ(position.z);

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
            <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 100] }}>
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
