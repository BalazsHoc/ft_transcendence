import Link from "react-router-dom";

export function Footer() {
  return <footer className="footer">
    <div className="footer-content">ft_transcendence - 42_Vienna Project</div>
    <div className="contributors">
      <span> (c) </span> 
      <a href="mailto:mhoushma@student.42.fr" target="_blank" rel="noopener noreferrer">
        mhoushma
      </a>
      <span>, </span>   
      <a href="mailto:bhocsak@student.42.fr" target="_blank" rel="noopener noreferrer">
        bhocsak
      </a>
      <span>, </span>
      <a href="mailto:cjuarez@student.42.fr" target="_blank" rel="noopener noreferrer">
        cjuarez
      </a>
      <span>, </span>
      <a href="mailto:oshcheho@student.42.fr" target="_blank" rel="noopener noreferrer">
        oshcheho
      </a>
      <span>, </span>
      <a href="mailto:pghajard@student.42.fr" target="_blank" rel="noopener noreferrer">
        pghajard
      </a>
    </div>
    </footer>;
}
