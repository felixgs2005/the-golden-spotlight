import "../styles/about.css";

import felixImg from "../assets/images/About us/felix.jpg";
import jessieImg from "../assets/images/About us/jessie.jpg";
import pictureFrame from "../assets/images/Decoration/Picture_Frame.png";
<link rel="stylesheet" href="https://use.typekit.net/xeu0lwa.css"></link>;

type TeamMemberProps = {
  name: string;
  photoSrc: string;
  photoAlt: string;
  bio: string;
  align?: "left" | "right";
};

function TeamMember({ name, photoSrc, photoAlt, bio, align = "left" }: TeamMemberProps) {
  return (
    <article className={`team-member team-member--${align}`} aria-labelledby={`${name}-heading`}>
      <figure className="team-member__media">
        <div className="team-member__photo-wrapper">
          <img className="team-member__photo" src={photoSrc} alt={photoAlt} />
          <img className="team-member__frame" src={pictureFrame} alt="" aria-hidden="true" />
        </div>
        <figcaption className="visually-hidden">{name}</figcaption>
      </figure>

      <div className="team-member__content">
        <h2 id={`${name}-heading`} className="team-member__name">
          {name}
        </h2>
        <p className="team-member__bio">{bio}</p>
      </div>
    </article>
  );
}

export default function AboutUs() {
  const felixBio =
    "Full-stack developer with a deep appreciation for structure, logic, and performance-driven solutions. Dedicated to writing clean, scalable code, Félix ensures that every interaction on The Golden Spotlight is fast, stable, and seamless. His technical precision and methodical approach bring strength to the project's creative foundation, turning visionary design into a reliable and dynamic digital experience.";

  const jessieBio =
    "Front-end developer and designer passionate about the intersection of technology, visual storytelling, and user experience. With a refined sense of composition and aesthetics, she transforms complex ideas into elegant, intuitive interfaces. Jessie's work on The Golden Spotlight blends modern web design with the timeless sophistication of Art Deco, crafting a cinematic atmosphere that celebrates both form and function.";

  return (
    <main id="main" className="about">
      <div className="about-header">
        <span className="about-header__corner about-header__corner--tl" aria-hidden="true" />
        <h1 className="about-header__title">About us</h1>
      </div>

      <section className="about__team" aria-label="Team">
        <TeamMember
          name="Félix Gray-Sylvain"
          photoSrc={felixImg}
          photoAlt="Portrait of Félix Gray-Sylvain"
          bio={felixBio}
          align="left"
        />
        <TeamMember
          name="Jessie Leclerc"
          photoSrc={jessieImg}
          photoAlt="Portrait of Jessie Leclerc"
          bio={jessieBio}
          align="right"
        />
      </section>
    </main>
  );
}
