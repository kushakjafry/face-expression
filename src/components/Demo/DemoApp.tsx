import React, { useState } from "react";
// import Canvas from "./Canvas";
import ThreeCanvas from "./ThreeCanvas";

function DemoApp() {
  // const [threeJsModelMode, setThreeJsModelMode] = useState(false);
  return (
    <section className="py-20 mt-20" id="demo">
      {/* <div className="py-10 container">
        <label className="relative flex justify-between items-center group p-2 text-xl">
          Switch to Three.js model
          <input
            type="checkbox"
            className="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md"
            onChange={(event) => {
              setThreeJsModelMode(event.target.value === "on" ? true : false);
            }}
          />
          <span className="w-16 h-10 flex items-center flex-shrink-0 ml-4 p-1 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-green-400 after:w-8 after:h-8 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-6 group-hover:after:translate-x-1"></span>
        </label>
      </div> */}
      {/* {!threeJsModelMode && <Canvas />} */}
      {/* {threeJsModelMode && <ThreeCanvas />} */}
      <ThreeCanvas />
    </section>
  );
}

export default DemoApp;
