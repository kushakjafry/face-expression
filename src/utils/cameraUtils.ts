import { AvatarView, CameraWrapper } from "@0xalter/alter-core";
import { IdleAnimationAvatarController } from "./avatarUtils";

export const cameraStop = (
  cameraWrapper: CameraWrapper,
  avatarView: AvatarView
) => {
  cameraWrapper.stop().then(() => {});
  avatarView.avatarController = new IdleAnimationAvatarController();
};
