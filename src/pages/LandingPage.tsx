import React from "react";
import DemoApp from "../components/Demo/DemoApp";
import HeroSection from "../components/HeroSection/HeroSection";
import Navbar from "../components/Navbar/Navbar";

function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <DemoApp />
    </>
  );
}

export default LandingPage;
