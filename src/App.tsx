import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";
import Category from "./pages/category";
import FilmDetails from "./pages/filmDetails";
import ActorProfile from "./pages/actorProfile";
import "./styles/styles.css";

function App() {
  return (
    <Router>
      <Header />
      <div className="body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/category" element={<Category />} />
          <Route path="/film/:id" element={<FilmDetails />} />
          <Route path="/actor/:id" element={<ActorProfile />} />
          {/* Page 404 simple */}
          <Route path="*" element={<h1>Page non trouvée</h1>} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
