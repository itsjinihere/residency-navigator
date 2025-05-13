import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">🏠 Home</Link>
      <Link to="/review">📋 Quiz Answers</Link>
      <a href="#checklist">✅ Checklist</a>
      <a href="#upload">📄 Upload Document</a>
      <a href="#status">📡 Status</a>
    </nav>
  );
};

export default Navbar;
