import React from "react";
import EmotionDetectImage from "../../assets/EmotionDetect.png";

function HeroSection() {
  return (
    <section className="relative">
      <div className="container flex flex-col-reverse lg:flex-row items-center mt-14 gap-12 lg:mt-28">
        <div className="flex flex-1 flex-col items-center lg:items-center ">
          <h2 className="text-face-blue text-5xl font-bold md:text-4 lg:text-7xl text-center lg:w-1/2 mb-9">
            Control your <span className=" text-face-purple ">3D Avatar</span>
          </h2>
          <h3 className="text-face-grey text-lg text-center mb-6 text-[24px] lg:w-3/5">
            Play around with the avatars and see how they copy your expression.
          </h3>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
