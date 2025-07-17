import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupPage({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c1e0c4] p-4">
      <form
        onSubmit={handleSignup}
        className="bg-white shadow-lg rounded-xl w-full max-w-md p-10 space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-[#154734]">Sign Up</h2>

        <input
  type="email"
  placeholder="Email"
  style={{ height: '2.5rem', fontSize: '1.25rem' }} // 4rem = 64px
  className="w-full px-6 py-4 rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#154734]"
  onChange={(e) => setEmail(e.target.value)}
  value={email}
/>

<input
  type="password"
  placeholder="Password"
  style={{ height: '2.5rem', fontSize: '1.25rem' }}
  className="w-full px-6 py-4 rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#154734]"
  onChange={(e) => setPassword(e.target.value)}
  value={password}
/>

        <button
          type="submit"
          className="w-full py-3 rounded-full bg-[#154734] text-lg font-semibold hover:bg-green-800 transition"
          style={{ color: '#ffffff' }}
        >
          Sign Up
        </button>

      </form>
    </div>
  );
}