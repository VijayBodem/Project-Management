interface Props {
  name: string;
  avatar?: string;
  size?: number;
  fontSize?: number;
}

export const UserAvatar = ({ name, avatar, size = 40, fontSize = 16 }: Props) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: avatar ? "transparent" : "#e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontSize}px`,
        fontWeight: "600",
        color: "#666",
        backgroundImage: avatar ? `url(${avatar})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        flexShrink: 0,
      }}
    >
      {!avatar && name.charAt(0).toUpperCase()}
    </div>
  );
};
