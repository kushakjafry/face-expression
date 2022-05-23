import React from "react";
import CameraOffSvg from "../../assets/svg/CameraOff";
import CameraOnSvg from "../../assets/svg/CameraOn";

interface CanvasControlsProps {
  handleAvatarSwitch: () => void;
  handleCameraClick: () => void;
  cameraOn: boolean;
}

function CanvasControls({
  handleAvatarSwitch,
  handleCameraClick,
  cameraOn,
}: CanvasControlsProps): JSX.Element {
  return (
    <div className="absolute top-0 left-0 h-[64px] bg-transparent w-full flex items-center px-4">
      <button
        className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-full"
        onClick={handleAvatarSwitch}
      >
        Switch Avatar
      </button>
      <ul className="flex flex-1 justify-end items-center gap-12 text-face-blue uppercase text-xs">
        <button
          onClick={handleCameraClick}
          className={`inline-block rounded-full ${
            cameraOn
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-red-600 hover:bg-red-700"
          } text-white leading-normal uppercase shadow-md hover:shadow-lg w-9 h-9`}
        >
          {cameraOn && <CameraOnSvg />}
          {!cameraOn && <CameraOffSvg />}
        </button>
      </ul>
    </div>
  );
}

export default CanvasControls;
