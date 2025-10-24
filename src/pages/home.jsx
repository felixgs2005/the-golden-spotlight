import React, { useState } from "react";
import "../styles/home.css";
import downtownAbbey from "../assets/images/series_poster/downtown_abbey.webp";

function HomePage() {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="home-container">
      <div className="section-hero">
        <img className="img-hero" src={downtownAbbey} alt="Downtown Abbey" />

      </div>
    </div>
  );
}

export default HomePage;