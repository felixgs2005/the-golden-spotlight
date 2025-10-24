import { useParams } from "react-router-dom";

export default function FilmDetails() {
  const { id } = useParams();
  return <h1>Détails du film #{id}</h1>;
}
