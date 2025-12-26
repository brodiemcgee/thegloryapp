// Floating Action Button for adding new locations

'use client';

interface AddLocationButtonProps {
  onClick: () => void;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function AddLocationButton({ onClick }: AddLocationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 p-4 bg-hole-accent hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 z-10"
      aria-label="Add location"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}
