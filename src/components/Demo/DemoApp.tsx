import React, { useState } from "react";
// import Canvas from "./Canvas";
import ThreeCanvas from "./threeCanvas/ThreeCanvas";

function DemoApp() {
  return (
    <section className="py-20 mt-20" id="demo">
      {/** Uncomment <Canvas /> and comment <ThreeCanvas /> will change canvas to alter-core canvas. we can use alter's model */}
      {/* <Canvas /> */}
      <ThreeCanvas />
    </section>
  );
}

export default DemoApp;
