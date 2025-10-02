"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  title?: string;
  message: string;
}

export default function Modal({ isOpen, onClose, onAccept, title, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        {title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
