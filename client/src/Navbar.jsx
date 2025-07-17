import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ token, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/">🏠 Home</Link>
      <Link to="/review">📋 Quiz Answers</Link>
      <a href="#checklist">✅ Checklist</a>
      <a href="#upload">📄 Upload Document</a>
      <Link to="/status">📡 Status</Link>
      {token ? (
        <button type="button" onClick={onLogout}>Logout</button>
      ) : (
        <>
          <Link to="/login">Log In</Link>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
