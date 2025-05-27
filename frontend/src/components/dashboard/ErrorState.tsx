import React from 'react';

interface ErrorStateProps {
  error: string | Error;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500">{errorMessage}</div>
    </div>
  );
};

export default ErrorState; 