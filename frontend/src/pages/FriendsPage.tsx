import { Navigate } from "react-router-dom";

/**
 * Keep the old URL working for bookmarks and notification links. Friends are
 * managed from the signed-in user's profile now.
 */
export function FriendsPage() {
  return <Navigate to="/profile" replace />;
}
