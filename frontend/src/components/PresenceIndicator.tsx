interface Viewer {
  userId: string;
  userName: string;
}

interface Props {
  viewers: Viewer[];
  currentUserId: string;
}

export const PresenceIndicator = ({ viewers, currentUserId }: Props) => {
  const otherViewers = viewers.filter((v) => v.userId !== currentUserId);

  if (otherViewers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-blue-600">
        {otherViewers.length} {otherViewers.length === 1 ? "person" : "people"}{" "}
        viewing
      </span>
      <div className="flex ml-1">
        {otherViewers.slice(0, 3).map((viewer, index) => (
          <div
            key={viewer.userId}
            title={viewer.userName}
            className={`w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[11px] font-semibold border-2 border-blue-50 ${
              index > 0 ? "-ml-2" : ""
            }`}
          >
            {viewer.userName.charAt(0).toUpperCase()}
          </div>
        ))}
        {otherViewers.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-[10px] font-semibold -ml-2 border-2 border-blue-50">
            +{otherViewers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
};
