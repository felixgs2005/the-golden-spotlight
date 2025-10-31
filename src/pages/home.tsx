import React from "react";
import { Link } from "react-router-dom"; // ← important pour la navigation
import "../styles/home.css";
import downtownAbbey from "../assets/images/series_poster/downtown_abbey.webp";

function HomePage() {
  // Exemple minimal d’un film
  const movie = {
    id: 1,
    title: "Downtown Abbey",
    year: 2025,
    posterUrl: downtownAbbey,
  };

  return (
    <div className="home-container">
      <div className="section-hero">
        <img className="img-hero" src={movie.posterUrl} alt={movie.title} />
        <h2>{movie.title}</h2>
        <p>{movie.year}</p>
        {/* Lien vers la page du film */}
        <Link to={`/film/${movie.id}`} className="btn-link">
          Voir le film
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
