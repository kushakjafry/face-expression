import React, { Suspense, useEffect, useRef, useState } from "react";
import { Face, Pose, Hand, Vector } from "kalidokit";
import { Canvas } from "@react-three/fiber";
import KalidokitCanvasElements from "./KalidokitCanvasElements";
import { clamp, remap } from "kalidokit/dist/utils/helpers";

import * as mp from "@mediapipe/holistic";
import * as cameraUtils from "@mediapipe/camera_utils";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import { Euler, Quaternion, Vector3 } from "three";
import Loader from "../threeCanvas/Loader";
const lerp = Vector.lerp;
const FACEMESH_TESSELATION = mp.FACEMESH_TESSELATION,
  HAND_CONNECTIONS = mp.HAND_CONNECTIONS,
  Holistic = mp.Holistic,
  POSE_CONNECTIONS = mp.POSE_CONNECTIONS,
  Camera = cameraUtils.Camera;

function KalidokitCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const [VRM_1, setVRM] = useState<VRM | null>(null);
  const oldLookTarget = useRef(new Euler());
  const holisticRef = useRef<typeof Holistic | null>(null);

  // const animate = async () => {
  //   requestAnimationFrame(animate);
  //   if (holisticRef.current) {
  //     await holisticRef.current.send({ image: videoRef.current! });
  //   }
  // };

  const rigFace = (vrm: VRM, riggedFace) => {
    if (!vrm) return;
    rigRotation("Neck", vrm, riggedFace.head, 0.7);

    const Blendshape = vrm.blendShapeProxy!;
    const PresetName = VRMSchema.BlendShapePresetName;

    riggedFace.eye.l = lerp(
      clamp(1 - riggedFace.eye.l, 0, 1),
      Blendshape.getValue(PresetName.Blink)!,
      0.5
    );
    riggedFace.eye.r = lerp(
      clamp(1 - riggedFace.eye.r, 0, 1),
      Blendshape.getValue(PresetName.Blink)!,
      0.5
    );
    riggedFace.eye = Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y);
    Blendshape.setValue(PresetName.Blink, riggedFace.eye.l);

    // Interpolate and set mouth blendshapes
    Blendshape.setValue(
      PresetName.I,
      lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), 0.5)
    );
    Blendshape.setValue(
      PresetName.A,
      lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), 0.5)
    );
    Blendshape.setValue(
      PresetName.E,
      lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), 0.5)
    );
    Blendshape.setValue(
      PresetName.O,
      lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), 0.5)
    );
    Blendshape.setValue(
      PresetName.U,
      lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), 0.5)
    );

    //PUPILS
    //interpolate pupil and keep a copy of the value
    let lookTarget = new Euler(
      lerp(oldLookTarget.current.x, riggedFace.pupil.y, 0.4),
      lerp(oldLookTarget.current.y, riggedFace.pupil.x, 0.4),
      0,
      "XYZ"
    );
    oldLookTarget.current.copy(lookTarget);
    vrm.lookAt!.applyer!.lookAt(lookTarget);
    vrm.blendShapeProxy?.update();
  };

  // Animate Rotation Helper function
  const rigRotation = (
    name,
    vrm: VRM,
    rotation = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!VRM_1) {
      return;
    }
    const Part = VRM_1.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName[name]);
    if (!Part) {
      return;
    }

    let euler = new Euler(
      rotation.x * dampener,
      rotation.y * dampener,
      rotation.z * dampener
    );
    let quaternion = new Quaternion().setFromEuler(euler);
    Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
  };

  // Animate Position Helper Function
  const rigPosition = (
    name,
    position = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!VRM_1) {
      return;
    }
    const Part = VRM_1.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName[name]);
    if (!Part) {
      return;
    }
    let vector = new Vector3(
      position.x * dampener,
      position.y * dampener,
      position.z * dampener
    );
    Part.position.lerp(vector, lerpAmount); // interpolate
  };

  const animateVRM = (vrm: VRM, results) => {
    if (!vrm) {
      return;
    }
    // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
    let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

    const faceLandmarks = results.faceLandmarks;
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.ea;
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks;
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks;
    const rightHandLandmarks = results.leftHandLandmarks;
    const videoElement = videoRef.current!;
    // Animate Face
    if (faceLandmarks) {
      riggedFace = Face.solve(faceLandmarks, {
        runtime: "mediapipe",
        video: videoElement,
      });
      rigFace(vrm, riggedFace);
    }

    // Animate Pose
    if (pose2DLandmarks && pose3DLandmarks) {
      riggedPose = Pose.solve(pose3DLandmarks, pose2DLandmarks, {
        runtime: "mediapipe",
        video: videoElement,
      });
      rigRotation("Hips", vrm, riggedPose.Hips.rotation, 0.7);
      rigPosition(
        "Hips",
        {
          x: -riggedPose.Hips.position.x, // Reverse direction
          y: riggedPose.Hips.position.y + 1, // Add a bit of height
          z: -riggedPose.Hips.position.z, // Reverse direction
        },
        1,
        0.07
      );

      rigRotation("Chest", vrm, riggedPose.Spine, 0.25, 0.3);
      rigRotation("Spine", vrm, riggedPose.Spine, 0.45, 0.3);

      rigRotation("RightUpperArm", vrm, riggedPose.RightUpperArm, 1, 0.3);
      rigRotation("RightLowerArm", vrm, riggedPose.RightLowerArm, 1, 0.3);
      rigRotation("LeftUpperArm", vrm, riggedPose.LeftUpperArm, 1, 0.3);
      rigRotation("LeftLowerArm", vrm, riggedPose.LeftLowerArm, 1, 0.3);

      rigRotation("LeftUpperLeg", vrm, riggedPose.LeftUpperLeg, 1, 0.3);
      rigRotation("LeftLowerLeg", vrm, riggedPose.LeftLowerLeg, 1, 0.3);
      rigRotation("RightUpperLeg", vrm, riggedPose.RightUpperLeg, 1, 0.3);
      rigRotation("RightLowerLeg", vrm, riggedPose.RightLowerLeg, 1, 0.3);
    }

    // Animate Hands
    if (leftHandLandmarks) {
      riggedLeftHand = Hand.solve(leftHandLandmarks, "Left");
      rigRotation("LeftHand", vrm, {
        // Combine pose rotation Z and hand rotation X Y
        z: riggedPose.LeftHand.z,
        y: riggedLeftHand.LeftWrist.y,
        x: riggedLeftHand.LeftWrist.x,
      });
      rigRotation("LeftRingProximal", vrm, riggedLeftHand.LeftRingProximal);
      rigRotation(
        "LeftRingIntermediate",
        vrm,
        riggedLeftHand.LeftRingIntermediate
      );
      rigRotation("LeftRingDistal", vrm, riggedLeftHand.LeftRingDistal);
      rigRotation("LeftIndexProximal", vrm, riggedLeftHand.LeftIndexProximal);
      rigRotation(
        "LeftIndexIntermediate",
        vrm,
        riggedLeftHand.LeftIndexIntermediate
      );
      rigRotation("LeftIndexDistal", vrm, riggedLeftHand.LeftIndexDistal);
      rigRotation("LeftMiddleProximal", vrm, riggedLeftHand.LeftMiddleProximal);
      rigRotation(
        "LeftMiddleIntermediate",
        vrm,
        riggedLeftHand.LeftMiddleIntermediate
      );
      rigRotation("LeftMiddleDistal", vrm, riggedLeftHand.LeftMiddleDistal);
      rigRotation("LeftThumbProximal", vrm, riggedLeftHand.LeftThumbProximal);
      rigRotation(
        "LeftThumbIntermediate",
        vrm,
        riggedLeftHand.LeftThumbIntermediate
      );
      rigRotation("LeftThumbDistal", vrm, riggedLeftHand.LeftThumbDistal);
      rigRotation("LeftLittleProximal", vrm, riggedLeftHand.LeftLittleProximal);
      rigRotation(
        "LeftLittleIntermediate",
        riggedLeftHand.LeftLittleIntermediate
      );
      rigRotation("LeftLittleDistal", vrm, riggedLeftHand.LeftLittleDistal);
    }
    if (rightHandLandmarks) {
      riggedRightHand = Hand.solve(rightHandLandmarks, "Right");
      rigRotation("RightHand", vrm, {
        // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
        z: riggedPose.RightHand.z,
        y: riggedRightHand.RightWrist.y,
        x: riggedRightHand.RightWrist.x,
      });
      rigRotation("RightRingProximal", vrm, riggedRightHand.RightRingProximal);
      rigRotation(
        "RightRingIntermediate",
        vrm,
        riggedRightHand.RightRingIntermediate
      );
      rigRotation("RightRingDistal", vrm, riggedRightHand.RightRingDistal);
      rigRotation(
        "RightIndexProximal",
        vrm,
        riggedRightHand.RightIndexProximal
      );
      rigRotation(
        "RightIndexIntermediate",
        vrm,
        riggedRightHand.RightIndexIntermediate
      );
      rigRotation("RightIndexDistal", vrm, riggedRightHand.RightIndexDistal);
      rigRotation(
        "RightMiddleProximal",
        vrm,
        riggedRightHand.RightMiddleProximal
      );
      rigRotation(
        "RightMiddleIntermediate",
        vrm,
        riggedRightHand.RightMiddleIntermediate
      );
      rigRotation("RightMiddleDistal", vrm, riggedRightHand.RightMiddleDistal);
      rigRotation(
        "RightThumbProximal",
        vrm,
        riggedRightHand.RightThumbProximal
      );
      rigRotation(
        "RightThumbIntermediate",
        vrm,
        riggedRightHand.RightThumbIntermediate
      );
      rigRotation("RightThumbDistal", vrm, riggedRightHand.RightThumbDistal);
      rigRotation(
        "RightLittleProximal",
        vrm,
        riggedRightHand.RightLittleProximal
      );
      rigRotation(
        "RightLittleIntermediate",
        vrm,
        riggedRightHand.RightLittleIntermediate
      );
      rigRotation("RightLittleDistal", vrm, riggedRightHand.RightLittleDistal);
    }
  };

  const onResults = (results) => {
    animateVRM(VRM_1!, results);
    // drawResults(results);
  };

  const initializeHolistic = async (holistic) => {
    await holistic.initialize();
    holisticRef.current! = holistic;
    const camera = new Camera(videoRef.current!, {
      onFrame: async () => {
        await holistic.send({ image: videoRef.current! });
      },
      width: canvasRef.current!.clientWidth,
      height: canvasRef.current!.clientHeight,
    });
    camera.start();
  };

  useEffect(() => {
    if (VRM_1) {
      console.log(Holistic);
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
      // animate();
    }
  }, [VRM_1]);

  // const drawResults = (results) => {
  //   const guideCanvas = canvas2Ref.current!;
  //   const videoElement = videoRef.current!;
  //   guideCanvas.width = videoElement.videoWidth;
  //   guideCanvas.height = videoElement.videoHeight;
  //   let canvasCtx = guideCanvas.getContext("2d");
  //   canvasCtx!.save();
  //   canvasCtx!.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
  //   // Use `Mediapipe` drawing functions
  //   drawConnectors(canvasCtx!, results.poseLandmarks, POSE_CONNECTIONS, {
  //     color: "#00cff7",
  //     lineWidth: 4,
  //   });
  //   drawLandmarks(canvasCtx!, results.poseLandmarks, {
  //     color: "#ff0364",
  //     lineWidth: 2,
  //   });
  //   drawConnectors(canvasCtx!, results.faceLandmarks, FACEMESH_TESSELATION, {
  //     color: "#C0C0C070",
  //     lineWidth: 1,
  //   });
  //   if (results.faceLandmarks && results.faceLandmarks.length === 478) {
  //     //draw pupils
  //     drawLandmarks(
  //       canvasCtx!,
  //       [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
  //       {
  //         color: "#ffe603",
  //         lineWidth: 2,
  //       }
  //     );
  //   }
  //   drawConnectors(canvasCtx!, results.leftHandLandmarks, HAND_CONNECTIONS, {
  //     color: "#eb1064",
  //     lineWidth: 5,
  //   });
  //   drawLandmarks(canvasCtx!, results.leftHandLandmarks, {
  //     color: "#00cff7",
  //     lineWidth: 2,
  //   });
  //   drawConnectors(canvasCtx!, results.rightHandLandmarks, HAND_CONNECTIONS, {
  //     color: "#22c3e3",
  //     lineWidth: 5,
  //   });
  //   drawLandmarks(canvasCtx!, results.rightHandLandmarks, {
  //     color: "#ff0364",
  //     lineWidth: 2,
  //   });
  // };

  // const computeFrame = async () => {
  //   await holisticRef.current!.send({ image: videoRef.current! });
  //   setTimeout(computeFrame, 0);
  // };

  return (
    <div className="flex justify-center flex-col items-center min-h-screen">
      <div className="flex w-full h-[100vw] sm:h-[75vw] md:h-[60vw] lg:h-[600px]">
        <div className="hidden sm:flex w-1/12 h-full"></div>
        <div className="flex w-full sm:w-10/12 h-full items-center rounded-md  justify-center">
          <div className="h-full w-1/2 bg-gray-700 relative">
            <Canvas ref={canvasRef} camera={{ zoom: 50, position: [0, 0, 50] }}>
              <Suspense fallback={<Loader />}>
                {/* <CanvasElements/> */}
                <KalidokitCanvasElements vrm={VRM_1} setVRM={setVRM} />
              </Suspense>
            </Canvas>
            {/* <ThreeCanvasControls
              handleCameraClick={handleCameraClick}
              cameraOn={cameraOn}
            /> */}
          </div>
          <div className="h-full w-1/2 relative">
            <video
              ref={videoRef}
              className="object-cover h-full"
              // onPlay={computeFrame}
              style={{
                transform: "scaleX(-1)",
              }}
              loop
            >
              <source src="m4f.mp4" type="video/mp4" />
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
