import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  color: string;
}

export default function Card({ title, description, icon, to, color }: CardProps) {
  return (
    <Link
      to={to}
      className={`block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 ${color}`}
    >
      <div className="flex items-center mb-4">
        <div className={`text-4xl mr-4`}>{icon}</div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
