import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  typingUsers?: {
    userId: number;
    userName: string;
    avatar?: string;
  }[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers = [] }) => {
  if (!typingUsers.length) return null;
  
  const visibleUsers = typingUsers.slice(0, 3);
  const remainingCount = typingUsers.length - 3;
  
  return (
    <div className="flex items-center gap-2  py-2">
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className="w-8 h-8 rounded-xl border-2 border-white bg-gray-200 overflow-hidden"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                {user.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
            +{remainingCount}
          </div>
        )}
      </div>
      <div className="typing-animation flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
};

export default TypingIndicator;