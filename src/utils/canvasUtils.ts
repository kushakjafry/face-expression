export const resizeCanvas = (canvas: HTMLCanvasElement) => {
  if (
    canvas.clientWidth !== canvas.width ||
    canvas.clientHeight !== canvas.height
  ) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
};
