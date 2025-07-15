import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">🏠 Home</Link>
      <Link to="/review">📋 Quiz Answers</Link>
      <a href="#checklist">✅ Checklist</a>
      <a href="#upload">📄 Upload Document</a>
      <Link to="/status">📡 Status</Link>
    </nav>
  );
};

export default Navbar;
