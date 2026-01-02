interface Props {
  message?: string;
  className?: string;
}

export const ErrorMessage = ({ message, className = "" }: Props) => {
  if (!message) return null;

  return (
    <div
      className={`text-sm text-red-600  mt-1 ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
};

export const ErrorAlert = ({ message, onClose }: { message: string; onClose?: () => void }) => {
  return (
    <div
      className="bg-red-50 /20 border border-red-200  text-red-800  px-4 py-3 rounded-lg relative mb-4"
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-red-600  hover:text-red-800 :text-red-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export const SuccessAlert = ({ message, onClose }: { message: string; onClose?: () => void }) => {
  return (
    <div
      className="bg-green-50 /20 border border-green-200  text-green-800  px-4 py-3 rounded-lg relative mb-4"
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-green-600  hover:text-green-800 :text-green-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
