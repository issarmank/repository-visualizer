import React from 'react';
import LoginButton from '../components/login-btn';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">  
      <button>Github OAuth</button>
      <LoginButton />
    </div>
  );
}
