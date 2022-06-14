import React, { useState } from "react";
import KalidokitCanvas from "./kalidokitCanvas/KalidokitCanvas";
import Canvas from "./alterCanvas/Canvas";
import ThreeCanvas from "./threeCanvas/ThreeCanvas";

function DemoApp() {
  return (
    <section className="py-20 mt-20" id="demo">
      {/** Uncomment <Canvas /> and comment <ThreeCanvas /> will change canvas to alter-core canvas. we can use alter's model */}
      <Canvas />
      {/* <ThreeCanvas /> */}
      {/* <KalidokitCanvas /> */}
    </section>
  );
}

export default DemoApp;
