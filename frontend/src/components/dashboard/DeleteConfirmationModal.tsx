import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../modals/Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
              </div>
        <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3 w-full pt-2">
            <button
              type="button"
            onClick={onClose}
            className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
            >
            Cancel
            </button>
            <button
              type="button"
            onClick={onConfirm}
            className="btn px-6 py-2 rounded-lg bg-red-600 border-none text-white font-semibold hover:bg-red-700 shadow-md"
            >
            Delete
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal; 