import { useParams } from "react-router-dom";

export default function ActorProfile() {
  const { id } = useParams();
  return <h1>Profil de l’acteur #{id}</h1>;
}
