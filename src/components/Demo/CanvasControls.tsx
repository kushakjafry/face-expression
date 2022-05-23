import React from "react";
import CameraOffSvg from "../../assets/svg/CameraOff";
import CameraOnSvg from "../../assets/svg/CameraOn";
import AvatarSwitcher from "./AvatarSwitcher";

interface CanvasControlsProps {
  handleAvatarSwitch: (index: number) => void;
  handleCameraClick: () => void;
  cameraOn: boolean;
  presets: any[];
  presetIndex: number;
}

function CanvasControls({
  handleAvatarSwitch,
  handleCameraClick,
  cameraOn,
  presets,
  presetIndex,
}: CanvasControlsProps): JSX.Element {
  return (
    <div className="absolute top-0 left-0 h-[64px] bg-transparent w-full flex items-center px-4">
      <AvatarSwitcher
        handleAvatarSwitch={handleAvatarSwitch}
        presets={presets}
        presetIndex={presetIndex}
      />
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
