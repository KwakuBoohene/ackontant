import React from 'react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-4">No Accounts Yet</h2>
      <p className="text-gray-600 mb-6">Add your first account to start tracking your finances.</p>
      <button
        onClick={onCreateClick}
        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark"
      >
        Add Your First Account
      </button>
    </div>
  );
};

export default EmptyState; 