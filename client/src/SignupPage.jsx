import { useState } from 'react';

export default function SignupPage({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
  };

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-2 p-4">
      <h2 className="text-xl font-bold">Sign Up</h2>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} value={email} />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} value={password} />
      <button type="submit">Sign Up</button>
    </form>
  );
}
