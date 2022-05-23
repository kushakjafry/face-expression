import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  avatarDataUrlFromKey,
  AvatarFactory,
  AvatarMatrix,
  AvatarView,
  CameraWrapper,
  Col,
  FaceTracker,
  Future,
  TrackerAvatarController,
  Try,
} from "@0xalter/alter-core";
import { resizeCanvas } from "../../utils/canvasUtils";
import { IdleAnimationAvatarController } from "../../utils/avatarUtils";
import { cameraStop } from "../../utils/cameraUtils";
import CanvasControls from "./CanvasControls";

function Canvas() {
  const avatarPresets = useRef<any[]>([]);
  const avatarRef = useRef<Avatar | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElement = useRef<HTMLVideoElement>(null);
  const [spinner, setspinner] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const avatarViewRef = useRef<AvatarView | null>(null);
  const avatarFactoryRef = useRef<AvatarFactory | null>(null);
  const cameraWrapperRef = useRef<CameraWrapper | null>(null);
  const didMount = useRef(false);

  const fetchPresetsArray = async () => {
    try {
      const data = await fetch("presets.json");
      const presets = await data.json();
      avatarPresets.current = presets;
    } catch (err) {
      console.error(err);
    }
  };

  const initializeAvatarFactory = (
    canvas: HTMLCanvasElement
  ): [Future<Try<Avatar>>, AvatarView, AvatarFactory] => {
    const avatarFactory = AvatarFactory.create(
      avatarDataUrlFromKey(
        "becgyw6rbmm6wj6ihffi3c2cru7o6zpxy4wlmp7t234l356aeiapm4y"
      ),
      canvas
    ).orThrow;
    const avatarView = new AvatarView(canvas);
    avatarView.setOnFrameListener(() => {
      resizeCanvas(canvas);
    });
    const avatarFuture = avatarFactory.createAvatarFromFile(
      "avatar.json",
      avatarFactory?.bundledFileSystem
    );
    fetchPresetsArray();
    return [avatarFuture, avatarView, avatarFactory];
  };

  const startCamera = (
    video: HTMLVideoElement,
    avatarFactory: AvatarFactory,
    avatarView: AvatarView
  ) => {
    const cameraWrapper = new CameraWrapper(video);
    cameraWrapperRef.current = cameraWrapper;
    const cameraTrackerFuture = FaceTracker.createVideoTracker(
      avatarFactory.bundledFileSystem
    );
    const avatar = avatarRef.current!;
    cameraTrackerFuture
      .promise()
      .then((faceTracker) => {
        const trackerAvatarController = TrackerAvatarController.create(
          faceTracker,
          avatar
        );
        cameraWrapper.start().logError("Error starting camera");
        cameraWrapper.addOnFrameListener((cameraTexture) => {
          const trackerResult =
            trackerAvatarController.updateFromCamera(cameraTexture);
          if (trackerResult) {
            avatarView.avatarController = trackerAvatarController;
          }
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    if (didMount.current) {
      const avatarFactory = avatarFactoryRef.current!;
      const avatarView = avatarViewRef.current!;
      const video = videoElement.current!;
      if (cameraOn) {
        startCamera(video, avatarFactory, avatarView);
      } else {
        const cameraWrapper = cameraWrapperRef.current!;
        cameraStop(cameraWrapper, avatarView);
        cameraWrapperRef.current = null;
      }
    } else {
      didMount.current = true;
    }
  }, [cameraOn]);

  const handleCameraClick = () => {
    setCameraOn(!cameraOn);
  };

  const renderAvatar = (
    avatarFuture: Future<Try<Avatar>>,
    avatarView: AvatarView
  ) => {
    avatarFuture.then((avatar) => {
      setspinner(false);
      avatarRef.current = avatar;
      avatarRef.current?.setBackgroundColor(Col.TRANSPARENT);
      avatarView.avatar = avatar;
      avatarView.avatarController = new IdleAnimationAvatarController();
    });
  };

  const handleAvatarSwitch = () => {
    const updatingIndex = (presetIndex + 1) % avatarPresets.current.length;
    console.log(`Updating to avatar preset ${updatingIndex}`);
    // setspinner(true);
    setPresetIndex(updatingIndex);
  };

  useEffect(() => {
    const presets = avatarPresets.current;
    if (presets && presets.length > 0) {
      avatarRef.current
        ?.updateAvatarFromObject(presets[presetIndex])
        .then(() => {
          // setspinner(false);
          console.log(`Updated to avatar preset ${presetIndex}`);
        });
    }
  }, [presetIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoElement.current;
    if (canvas && video) {
      const [avatarFuture, avatarView, avatarFactory] =
        initializeAvatarFactory(canvas);
      avatarViewRef.current = avatarView;
      avatarFactoryRef.current = avatarFactory;
      renderAvatar(avatarFuture, avatarView);
    }
  }, []);
  return (
    <div className="flex justify-center flex-col items-center min-h-screen">
      <div className="flex w-full h-[100vw] sm:h-[75vw] md:h-[60vw] lg:h-auto">
        <div className="hidden sm:flex w-1/12 h-full"></div>
        <div className="flex w-full sm:w-10/12 h-full items-center rounded-md bg-gray-700 relative justify-center">
          <canvas ref={canvasRef} height="600" className="w-full h-full" />
          <video ref={videoElement} style={{ display: "none" }} />
          {spinner && (
            <div className="absolute w-full h-full top-0 left-0  flex justify-center items-center">
              <div className="text-white">Loading Model</div>
            </div>
          )}

          {!spinner && (
            <CanvasControls
              handleAvatarSwitch={handleAvatarSwitch}
              handleCameraClick={handleCameraClick}
              cameraOn={cameraOn}
            />
          )}
        </div>
        <div className="hidden sm:flex w-1/12 h-full"></div>
      </div>
    </div>
  );
}

export default Canvas;
