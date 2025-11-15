import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  color: string;
}

export default function Card({ title, description, icon, to, color }: CardProps) {
  const { colors } = useTheme();

  return (
    <Link
      to={to}
      className={`block p-6 ${colors.card} rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 ${color}`}
    >
      <div className="flex items-center mb-4">
        <div className={`text-4xl mr-4`}>{icon}</div>
        <h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3>
      </div>
      <p className={colors.textSecondary}>{description}</p>
    </Link>
  );
}
