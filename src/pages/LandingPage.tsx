import React from "react";
import DemoApp from "../components/Demo/DemoApp";
import Footer from "../components/Footer/Footer";
import HeroSection from "../components/HeroSection/HeroSection";
import Navbar from "../components/Navbar/Navbar";

function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <DemoApp />
      <Footer />
    </>
  );
}

export default LandingPage;
