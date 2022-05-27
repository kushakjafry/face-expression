import { GLTFLoader, KTX2Loader } from "three-stdlib";
// @ts-nocheck
import { MeshoptDecoder } from "meshoptimizer";
import { useLoader, useThree } from "@react-three/fiber";

// @ts-ignore
let ktx2Loader: KTX2Loader | null = null;
function extensions(
  useKTX2: boolean | string,
  useMeshopt: boolean,
  gl,
  extendLoader?: (loader: GLTFLoader) => void
) {
  return (loader) => {
    if (extendLoader) {
      extendLoader(loader);
    }

    if (useKTX2) {
      if (!ktx2Loader) {
        ktx2Loader = new KTX2Loader();
      }
      ktx2Loader.setTranscoderPath("js/libs/basis/").detectSupport(gl);
      (loader as GLTFLoader).setKTX2Loader(ktx2Loader);
    }

    if (useMeshopt) {
      (loader as GLTFLoader).setMeshoptDecoder(
        // @ts-ignore
        typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder
      );
    }
  };
}

export function useGLTF<T extends string | string[]>(
  path: T,
  useKTX2: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) {
  const { gl } = useThree();
  console.log("Ran");

  const gltf = useLoader(
    GLTFLoader,
    path,
    extensions(useKTX2, useMeshOpt, gl, extendLoader)
  );
  return gltf;
}

useGLTF.preload = (
  path: string | string[],
  useKTX2: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) =>
  useLoader.preload(
    GLTFLoader,
    path,
    extensions(useKTX2, useMeshOpt, extendLoader)
  );

useGLTF.clear = (input: string | string[]) =>
  useLoader.clear(GLTFLoader, input);
