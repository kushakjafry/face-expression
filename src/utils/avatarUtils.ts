import {
  AvatarAnimationData,
  AvatarController,
  Nullable,
  Quaternion,
  Timer,
  Vec3,
} from "@0xalter/alter-core";

export class IdleAnimationAvatarController implements AvatarController {
  private timer = Timer.start();
  frame(): Nullable<AvatarAnimationData> {
    const time = this.timer.tick().elapsed;
    const smile = 0.5 + 0.5 * Math.sin(time * 0.5);
    // for the list of available expression, print EXPRESSION_BLENDSHAPES
    return new AvatarAnimationData(
      new Map([
        ["mouthSmile_L", smile],
        ["mouthSmile_R", smile],
      ]),
      AvatarAnimationData.DEFAULT_AVATAR_POSITION,
      Quaternion.fromRotation(0.3 * Math.sin(time * 0.5), Vec3.zAxis),
      Vec3.createWithNum(0.5)
    );
  }
}

export function faceRotationToBlendshapes(
  rotation: Quaternion
): Array<[string, number]> {
  let euler = rotation.toEuler();
  let halfPi = Math.PI * 0.5;
  return [
    ["headLeft", Math.max(0, euler.y) / halfPi],
    ["headRight", -Math.min(0, euler.y) / halfPi],
    ["headUp", -Math.min(0, euler.x) / halfPi],
    ["headDown", Math.max(0, euler.x) / halfPi],
    ["headRollLeft", -Math.min(0, euler.z) / halfPi],
    ["headRollRight", Math.max(0, euler.z) / halfPi],
  ];
}
