import { FaTools } from "react-icons/fa";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <FaTools className="text-4xl text-primary animate-pulse" aria-hidden="true" />
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="opacity-70">Loading...</p>
    </div>
  );
};

export default Loading;