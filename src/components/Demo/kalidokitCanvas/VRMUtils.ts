import { VRM, VRMSchema } from "@pixiv/three-vrm";
import { Face, Hand, Pose } from "kalidokit";
import { Euler, Quaternion, Vector3 } from "three";
import { clamp, lerp } from "three/src/math/MathUtils";

export const onExpressionDetection = (
  emotions: {
    expression: string;
    probability: number;
  }[],
  vrm: VRM
) => {
  if (!vrm) return;
  const Blendshape = vrm.blendShapeProxy!;
  const PresetName = VRMSchema.BlendShapePresetName;
  const emotionPresetMapper = {
    happy: PresetName.Fun,
    neutral: PresetName.Neutral,
    angry: PresetName.Angry,
    surprised: "Surprised",
    sad: PresetName.Sorrow,
  };
  emotions.forEach((emotion) => {
    if (emotion.expression in emotionPresetMapper) {
      Blendshape.setValue(
        emotionPresetMapper[emotion.expression],
        emotion.probability
      );
    }
  });
  vrm.blendShapeProxy?.update();
};

export const rigPosition = (
  name,
  vrm: VRM,
  position = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3
) => {
  if (!vrm) {
    return;
  }
  const Part = vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName[name]);
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

export const rigFace = (vrm: VRM, riggedFace, oldLookTarget) => {
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
    lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I)!, 0.5)
  );
  Blendshape.setValue(
    PresetName.A,
    lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A)!, 0.5)
  );
  Blendshape.setValue(
    PresetName.E,
    lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E)!, 0.5)
  );
  Blendshape.setValue(
    PresetName.O,
    lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O)!, 0.5)
  );
  Blendshape.setValue(
    PresetName.U,
    lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U)!, 0.5)
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

export const rigRotation = (
  name,
  vrm: VRM,
  rotation = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3
) => {
  if (!vrm) {
    return;
  }
  const Part = vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName[name]);
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
export const animateVRM = (vrm: VRM, results, videoElement, oldLookTarget) => {
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
  // Animate Face
  if (faceLandmarks) {
    riggedFace = Face.solve(faceLandmarks, {
      runtime: "mediapipe",
      video: videoElement,
    });
    rigFace(vrm, riggedFace, oldLookTarget);
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
      vrm,
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
      vrm,
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
    rigRotation("RightIndexProximal", vrm, riggedRightHand.RightIndexProximal);
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
    rigRotation("RightThumbProximal", vrm, riggedRightHand.RightThumbProximal);
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
