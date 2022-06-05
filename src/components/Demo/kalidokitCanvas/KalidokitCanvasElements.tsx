import React, { Ref, RefObject, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useGLTF } from "../../../hooks/useGltf";
import { useThree } from "@react-three/fiber";
import { VRM, VRMUtils } from "@pixiv/three-vrm";
import { GLTF } from "three-stdlib";

function KalidokitCanvasElements({ vrm, setVRM }) {
  const url = "some.vrm";
  const gltf = useGLTF(url);
  useEffect(() => {
    if (gltf) {
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      VRM.from(gltf as unknown as GLTF).then((vrm) => {
        setVRM(vrm);
        // console.log(vrm);
        vrm.scene.rotation.y = Math.PI;
      });
    }
  }, [gltf]);

  return (
    <>
      <OrbitControls />
      {/* <ambientLight intensity={1} /> */}
      <directionalLight position={[1, 1, 1]} color={0xffffff} intensity={0.6} />
      {vrm && <primitive object={vrm.scene} position={[0, -1.5, 0]} />}
    </>
  );
}

export default KalidokitCanvasElements;
