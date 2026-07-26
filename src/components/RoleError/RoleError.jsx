import { Link } from "react-router";

// Shown when a route guard's role lookup fails (network/server error) - kept
// distinct from Forbidden, which means "authenticated but wrong role."
const RoleError = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
            <h1 className="text-2xl font-bold text-red-500">
                We couldn't confirm your account access right now.
            </h1>
            <p className="text-gray-600 mt-2">
                Please refresh the page or try again shortly.
            </p>
            <Link to="/" className="btn btn-primary text-black mt-4">
                Go to Home
            </Link>
        </div>
    );
};

export default RoleError;
