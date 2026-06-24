import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DiscoverPage } from "../pages/DiscoverPage";
import { MapPage } from "../pages/MapPage";
import { EventDetailsPage } from "../pages/EventDetailsPage";
import { CreateEventPage } from "../pages/CreateEventPage";
import { EditEventPage } from "../pages/EditEventPage";
import { MyEventsPage } from "../pages/MyEventsPage";
import { ChatsPage } from "../pages/ChatsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ApiTesterPage } from "../pages/ApiTesterPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="events/new" element={<CreateEventPage />} />
        <Route path="events/:eventId" element={<EventDetailsPage />} />
        <Route path="events/:eventId/edit" element={<EditEventPage />} />
        <Route path="my-events" element={<MyEventsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="api-test" element={<ApiTesterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}