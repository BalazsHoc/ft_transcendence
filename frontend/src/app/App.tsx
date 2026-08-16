import { Route, Routes, Navigate } from "react-router-dom";
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
import { UserProfilePage } from "../pages/UserProfilePage";
import { GroupsPage } from "../pages/GroupsPage";
import { GroupDetailsPage } from "../pages/GroupDetailsPage";
import { ApiTesterPage } from "../pages/ApiTesterPage";
import { UiElementsTest } from "../pages/UiElementsTest";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "../pages/TermsOfServicePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="clubs" element={<Navigate to="/groups" replace />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="events/new" element={<CreateEventPage />} />
        <Route path="events/:eventId" element={<EventDetailsPage />} />
        <Route path="events/:eventId/edit" element={<EditEventPage />} />
        <Route path="my-events" element={<MyEventsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="friends" element={<Navigate to="/profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="users/:userId" element={<UserProfilePage />} />
        <Route path="api-test" element={<ApiTesterPage />} />
        <Route path="ui-elements-test" element={<UiElementsTest />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
