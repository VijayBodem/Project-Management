interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

interface Props {
  cursors: Cursor[];
}

export const CollaborativeCursor = ({ cursors }: Props) => {
  const getColor = (userId: string) => {
    // Generate consistent color based on userId
    const colors = [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#ff9800",
    ];
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="fixed pointer-events-none z-[9998] transition-all duration-100 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-md"
          >
            <path
              d="M5.65376 12.3673L13.1844 4.83666C13.5263 4.49474 14.0874 4.61357 14.2718 5.04773L17.3236 11.8984C17.5079 12.3325 17.1665 12.8096 16.7101 12.7522L12.7536 12.2251C12.5756 12.2014 12.4042 12.2815 12.3013 12.4334L9.26496 16.6286C8.98692 17.0137 8.41776 17.0286 8.11884 16.6604L5.65376 13.8778C5.34478 13.4977 5.34478 12.9374 5.65376 12.5573V12.3673Z"
              fill={getColor(cursor.userId)}
            />
          </svg>

          {/* User name label */}
          <div
            className="absolute top-5 left-2.5 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-md"
            style={{ backgroundColor: getColor(cursor.userId) }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </>
  );
};
