import React, { useState } from "react";
import DropdownArrow from "../../../assets/svg/DropdownArrow";

interface AvatarSwitcherProps {
  handleAvatarSwitch: (index: number) => void;
  presets: any[];
  presetIndex: number;
}

function AvatarSwitcher({
  handleAvatarSwitch,
  presets,
  presetIndex,
}: AvatarSwitcherProps): JSX.Element {
  const [hideMenu, setHideMenu] = useState(true);
  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          onClick={() => setHideMenu(!hideMenu)}
        >
          Change Avatar
          <DropdownArrow />
        </button>
      </div>

      {presets?.length > 0 && (
        <div
          className={`origin-top-right absolute right-0 mt-2 w-40 h-80  overflow-y-scroll rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${
            hideMenu ? "hidden" : ""
          }`}
        >
          <div className="py-1" role="none">
            {presets.map((preset, i) => (
              <div
                className={`text-gray-700 w-full text-left px-4 py-2 text-sm ${
                  presetIndex == i
                    ? " cursor-not-allowed bg-green-500"
                    : "cursor-pointer"
                } flex justify-center border-b-2 border-solid`}
                key={i}
                onClick={() => {
                  if (presetIndex == i) return;
                  handleAvatarSwitch(i);
                  setHideMenu(true);
                }}
              >
                <div className=" h-20 w-20 rounded-full bg-gray-600 hover:bg-gray-500 overflow-hidden">
                  <img src={preset.imgLink} className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarSwitcher;
