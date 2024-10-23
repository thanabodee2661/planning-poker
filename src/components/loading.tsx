export default function Loading({
  size = "12",
  color = "blue-500",
  message = "",
}) {
  return (
    <div className="flex flex-col gap-2 justify-center items-center h-screen">
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-t-2 border-b-2 border-${color}`}
      ></div>
      {message ? (
        <div className="block mb-2 text-md text-slate-600">{message}</div>
      ) : (
        ""
      )}
    </div>
  );
}
