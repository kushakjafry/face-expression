import { Html, useProgress } from "@react-three/drei";

export default function Loader() {
  const { progress } = useProgress();
  return (
    <Html className="text-white" center>
      {progress} % loaded
    </Html>
  );
}
