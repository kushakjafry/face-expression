import { Vector3 } from "three";

export const resizeCanvas = (canvas: HTMLCanvasElement) => {
  if (
    canvas.clientWidth !== canvas.width ||
    canvas.clientHeight !== canvas.height
  ) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
};

export const getWorldCordinates = (
  canvas: HTMLCanvasElement,
  X: number,
  Y: number,
  camera: any
) => {
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  let vec = new Vector3();
  let pos = new Vector3();
  vec.set((X / canvasWidth) * 2 - 1, -(Y / canvasHeight) * 2 + 1, 0.5);
  vec.unproject(camera);
  vec.sub(camera.position).normalize();
  var distance = -camera.position.z / vec.z;
  pos.copy(camera.position).add(vec.multiplyScalar(distance));
  return pos;
};
