import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faCodeBranch,
  faCodeMerge,
  faLaptopCode,
  faShieldHalved,
  faTerminal,
  faServer
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import vivekPic from "../../assets/devs/vivek.png";
import krishPic from "../../assets/devs/krish.jpg";
import arinPic from "../../assets/devs/arin.png";
import "./Developer.css";

const teamMembers = [
  {
    name: "Vivek Chaurasiya",
    role: "Full Stack Developer",
    bio: "Focuses on backend systems, robust architecture, and smooth data flow. Ensures that the servers run efficiently under high load to support thousands of concurrent competitive programming sessions.",
    pic: vivekPic,
    stack: "Backend Systems",
    skills: ["Node.js", "System Architecture", "Database Modeling"],
    icon: faServer,
    tone: "cyan",
    linkedin: "https://www.linkedin.com/in/vivek-chaurasiya-722037315",
    github: "https://github.com/VivekChaurasiya95",
  },
  {
    name: "Krish Dargar",
    role: "Full Stack Developer",
    bio: "Specializes in UI tweaks and frontend design. Crafts intuitive product experiences and structures coding systems for long-term scale. Translates deep algorithmic ideas into interfaces that feel fast, clear, and reliable.",
    pic: krishPic,
    stack: "UI Design",
    skills: ["UI/UX Systems", "React.js", "Design Language"],
    icon: faLaptopCode,
    tone: "pink",
    linkedin: "https://www.linkedin.com/in/krish-dargar-101774324/",
    github: "https://github.com/KD2303",
  },
  {
    name: "Arin Gupta",
    role: "Full Stack Developer",
    bio: "Drives the main backend logic and oversees UI design. Builds high-impact interfaces and performance-first engineering flows for coders. Obsessed with realtime systems, smooth interactions, and a battle experience that feels sharp.",
    pic: arinPic,
    stack: "Core Logic & Design",
    skills: ["Realtime Systems", "Full Stack Architecture", "Product Strategy"],
    icon: faCodeMerge,
    tone: "cyan",
    linkedin: "https://www.linkedin.com/in/arin-gupta-2b94b032a/",
    github: "https://github.com/arin-gupta06",
  },
];

const developerStats = [
  { label: "Core Engineers", value: "3" },
  { label: "Focus Areas", value: "6" },
  { label: "Realtime Features", value: "10+" },
  { label: "Iteration Speed", value: "Fast" },
];

const principles = [
  {
    icon: faBolt,
    title: "Performance First",
    copy: "Every interaction is tuned for speed, from page transitions to live battle feedback.",
  },
  {
    icon: faShieldHalved,
    title: "Competitive Integrity",
    copy: "Battle systems prioritize fairness and secure test evaluation under pressure.",
  },
  {
    icon: faCodeBranch,
    title: "Scalable Architecture",
    copy: "Features are built with reusable patterns so the platform can expand cleanly.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function Developer() {
  return (
    <div className="developer-page">
      <motion.section
        className="developer-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="developer-pre-heading">Core Team</div>
        <h1>
          Built By <span>AlgoFight Architects</span>
        </h1>
        <p>
          Meet the developers behind AlgoFight. This page highlights the people shaping the realtime coding arena,
          from backend systems to interface clarity.
        </p>

        <div className="developer-stat-grid">
          {developerStats.map((item) => (
            <article key={item.label} className="developer-stat-card">
              <div className="developer-stat-value">{item.value}</div>
              <div className="developer-stat-label">{item.label}</div>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="developer-team-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {teamMembers.map((member, index) => (
          <motion.article
            key={member.name}
            variants={childVariants}
            className={`developer-member-card ${member.tone} ${index % 2 === 1 ? "reverse" : ""}`}
          >
            <div className="developer-avatar-wrap">
              <div className="developer-avatar-glow" />
              {member.pic ? (
                 <img src={member.pic} alt={member.name} className="developer-avatar-img" />
              ) : (
                 <div className="developer-avatar">{member.initials}</div>
              )}
              <div className="developer-icon-badge">
                <FontAwesomeIcon icon={member.icon} />
              </div>
            </div>

            <div className="developer-member-content">
              <div className="developer-member-head">
                <h2>{member.name}</h2>
                <span className="developer-chip">{member.stack}</span>
              </div>

              <h3>
                <FontAwesomeIcon icon={faCodeMerge} />
                {member.role}
              </h3>

              <p>{member.bio}</p>

              <div className="developer-skill-list">
                {member.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <div className="developer-social-links">
                {member.linkedin !== "#" && (
                  <a href={member.linkedin} target="_blank" rel="noreferrer" className={`social-btn ${member.tone}`}>
                    <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                  </a>
                )}
                {member.github !== "#" && (
                  <a href={member.github} target="_blank" rel="noreferrer" className={`social-btn ${member.tone}`}>
                    <FontAwesomeIcon icon={faGithub} /> GitHub
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </motion.section>

      <motion.section
        className="developer-principles-panel"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="developer-panel-header">
          <h2>Engineering Principles</h2>
          <span className="developer-chip">Live Platform DNA</span>
        </div>

        <div className="developer-principles-grid">
          {principles.map((item) => (
            <article key={item.title} className="developer-principle-card">
              <span className="developer-principle-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default Developer;
