import React, { Ref, RefObject, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useGLTF } from "../../hooks/useGltf";
import {
  OrthographicCameraProps,
  useFrame,
  useThree,
} from "@react-three/fiber";

function CanvasElements({ setHead, setScene, setCamera }) {
  const url = "facecap.glb";
  const { nodes, materials, scene } = useGLTF(url);
  const head = nodes.mesh_2;
  const { camera } = useThree();
  // @ts-ignore
  const influences = head.morphTargetInfluences;
  useEffect(() => {
    setHead(head);
    setScene(scene);
    setCamera(camera);
  }, []);

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.6} />
      <primitive object={scene} />
    </>
  );
}

export default CanvasElements;
