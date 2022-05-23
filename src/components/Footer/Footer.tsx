import React from "react";
import GithubSvg from "../../assets/svg/GithubSvg";

function Footer() {
  return (
    <footer className="bg-face-blue py-8">
      <div className="container flex flex-col md:flex-row items-center">
        <div className="flex flex-1 flex-wrap items-center justify-center md:justify-start gap-12">
          <div className="font-bold text-white">3D-Avatars</div>
        </div>
        <ul className="flex gap-10 mt-12 md:mt-0">
          <li className="text-white">
            <a href="https://github.com/kushakjafry/face-expression">
              <GithubSvg />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;
