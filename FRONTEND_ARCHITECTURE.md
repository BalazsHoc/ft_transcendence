# Frontend Architecture Blueprint

This document describes a practical target structure for building a solid, maintainable frontend for this project. The current app is a React + TypeScript + Vite frontend for a sports event platform with authentication, event discovery, maps, chat, profiles, and internationalization.

## Goals

- Keep pages thin and move reusable behavior into features, components, hooks, and API modules.
- Make domain features easy to find: auth, events, map, chat, profile, geo, and shared UI.
- Keep API access typed and centralized.
- Make loading, empty, error, and permission states consistent across the app.
- Support responsive layouts, dark mode, i18n, and future real-time features without rewriting the whole UI.

## Recommended Folder Structure

```txt
frontend/
  public/
    assets/
      icons/
      images/
      markers/
  src/
    app/
      App.tsx
      providers/
        AppProviders.tsx
        RouterProvider.tsx
        I18nProvider.tsx
      routes/
        routes.tsx
        ProtectedRoute.tsx
        PublicOnlyRoute.tsx
      config/
        env.ts
        navigation.ts
        featureFlags.ts

    api/
      client.ts
      endpoints.ts
      errors.ts
      authApi.ts
      eventsApi.ts
      geoApi.ts
      chatApi.ts
      profileApi.ts

    assets/
      images/
      icons/

    components/
      layout/
        AppLayout.tsx
        Header.tsx
        Footer.tsx
        Sidebar.tsx
        MobileNav.tsx
        PageShell.tsx
        PageHeader.tsx
      shared/
        ApiLog.tsx
        Avatar.tsx
        Badge.tsx
        Button.tsx
        Card.tsx
        EmptyState.tsx
        ErrorState.tsx
        FieldError.tsx
        IconButton.tsx
        Input.tsx
        Label.tsx
        LanguageSwitcher.tsx
        LoadingSpinner.tsx
        Modal.tsx
        Select.tsx
        Tabs.tsx
        Textarea.tsx
        Toast.tsx
      forms/
        FormActions.tsx
        FormCard.tsx
        FormField.tsx
        ImageUploadField.tsx
        LocationField.tsx
        MultiSelectField.tsx

    features/
      auth/
        AuthContext.tsx
        hooks/
          useAuth.ts
          useRequireAuth.ts
        components/
          LoginForm.tsx
          RegisterForm.tsx
          AuthCard.tsx
          UserMenu.tsx
        pages/
          LoginPage.tsx
          RegisterPage.tsx

      events/
        types.ts
        constants.ts
        hooks/
          useEvents.ts
          useEvent.ts
          useEventForm.ts
          useEventActions.ts
          useMyEvents.ts
        components/
          EventCard.tsx
          EventCardGrid.tsx
          EventCardList.tsx
          EventDetailsHeader.tsx
          EventForm.tsx
          EventImage.tsx
          EventMeta.tsx
          EventParticipants.tsx
          EventStatusBadge.tsx
          EventFilters.tsx
          EventSearchBar.tsx
          JoinEventButton.tsx
          LeaveEventButton.tsx
          DeleteEventButton.tsx
        pages/
          DiscoverPage.tsx
          EventDetailsPage.tsx
          CreateEventPage.tsx
          EditEventPage.tsx
          MyEventsPage.tsx

      map/
        hooks/
          useLeaflet.ts
          useMapTheme.ts
          useEventMarkers.ts
          useNearbyEvents.ts
        components/
          EventMap.tsx
          MapControls.tsx
          MapMarkerPopup.tsx
          MapSidebar.tsx
          MapStatus.tsx
          NearbyEventList.tsx
        pages/
          MapPage.tsx

      geo/
        hooks/
          useGeoSearch.ts
        components/
          LocationAutocomplete.tsx
          LocationSuggestionList.tsx
          LocationPreview.tsx

      chat/
        hooks/
          useEventMessages.ts
          useEventChatSocket.ts
        components/
          ChatComposer.tsx
          ChatMessage.tsx
          ChatMessageList.tsx
          EventChat.tsx
          EventChatPanel.tsx
          ChatEventSelector.tsx
        pages/
          ChatsPage.tsx

      profile/
        hooks/
          useProfile.ts
          useProfileForm.ts
        components/
          ProfileCard.tsx
          ProfileForm.tsx
          ProfileAvatarUploader.tsx
          UserSportsList.tsx
          UserLanguagesList.tsx
        pages/
          ProfilePage.tsx

      landing/
        components/
          HeroSection.tsx
          FeaturedEventsSection.tsx
          HowItWorksSection.tsx
        pages/
          LandingPage.tsx

      devtools/
        components/
          ApiTester.tsx
          UiElementsPreview.tsx
        pages/
          ApiTesterPage.tsx
          UiElementsTestPage.tsx

    hooks/
      useAsync.ts
      useDebouncedValue.ts
      useLocalStorage.ts
      useMediaQuery.ts
      useOnClickOutside.ts

    i18n/
      i18n.ts
      locales/
        en.json
        de.json
        ua.json

    layouts/
      AppLayout.tsx

    lib/
      date.ts
      distance.ts
      formatters.ts
      guards.ts
      storage.ts
      validators.ts

    styles/
      global.css
      theme.css
      tailwind.css

    types/
      api.ts
      common.ts
      navigation.ts

    utils/
      media.ts

    main.tsx
    vite-env.d.ts
```

## Page Inventory

| Page | Route | Responsibility |
| --- | --- | --- |
| `LandingPage` | `/` | First screen, product context, entry points to discover and create events. |
| `DiscoverPage` | `/discover` | Browse and filter public events. |
| `MapPage` | `/map` | Search a location and inspect nearby events on a map. |
| `EventDetailsPage` | `/events/:eventId` | Full event details, participants, join/leave actions, chat entry. |
| `CreateEventPage` | `/events/new` | Create a new event with image, location, dates, and capacity. |
| `EditEventPage` | `/events/:eventId/edit` | Edit an existing event. |
| `MyEventsPage` | `/my-events` | Events created by the user and events joined or waitlisted. |
| `ChatsPage` | `/chats` | Event chat selection and message panel. |
| `ProfilePage` | `/profile` | User profile details and preferences. |
| `LoginPage` | `/login` | Existing user authentication. |
| `RegisterPage` | `/register` | New user registration. |
| `ApiTesterPage` | `/api-test` | Development-only API testing. |
| `UiElementsTestPage` | `/ui-elements-test` | Development-only UI component preview. |
| `NotFoundPage` | `*` | Unknown route fallback. |

## Component List

### Layout Components

- `AppLayout`: root layout with header, main content, and footer.
- `Header`: desktop navigation, auth menu, language switcher, theme controls.
- `MobileNav`: compact mobile navigation.
- `Footer`: low-priority links and project metadata.
- `PageShell`: consistent page width, spacing, and responsive padding.
- `PageHeader`: title, subtitle, primary actions, and optional breadcrumbs.
- `Sidebar`: reusable secondary navigation or contextual panel.

### Shared UI Components

- `Button`: primary, secondary, ghost, danger, and loading states.
- `IconButton`: compact icon-only actions with accessible labels.
- `Input`: text input with label, error, hint, and disabled state.
- `Textarea`: multi-line input with validation states.
- `Select`: single-option selector.
- `Badge`: level, sport, status, language, and participant badges.
- `Card`: simple framed item container, mainly for repeated items.
- `Avatar`: user image or initials fallback.
- `Modal`: confirmations and focused tasks.
- `Tabs`: switch between related views.
- `LoadingSpinner`: loading indicator.
- `EmptyState`: useful empty screens with optional action.
- `ErrorState`: recoverable error display.
- `Toast`: success and error notifications.
- `LanguageSwitcher`: current i18n language selector.
- `ApiLog`: development helper for API request output.

### Form Components

- `FormCard`: consistent form container.
- `FormField`: label, control, hint, and error wrapper.
- `FormActions`: submit and cancel action row.
- `ImageUploadField`: event image selection and preview.
- `LocationField`: location search plus selected address preview.
- `MultiSelectField`: languages, sports, and interests.

### Auth Components

- `AuthProvider`: owns current user, token state, login, register, logout, and refresh.
- `ProtectedRoute`: blocks private pages when no user is authenticated.
- `PublicOnlyRoute`: redirects authenticated users away from login/register.
- `LoginForm`: username and password form.
- `RegisterForm`: account creation form.
- `AuthCard`: consistent auth page shell.
- `UserMenu`: authenticated user dropdown with profile and logout.

### Event Components

- `EventCard`: compact summary for event lists.
- `EventCardGrid`: responsive event grid.
- `EventCardList`: stacked event list.
- `EventImage`: image rendering with fallback.
- `EventMeta`: sport, level, date, location, language, and capacity summary.
- `EventStatusBadge`: attending, waiting, full, or created-by-me status.
- `EventParticipants`: attending and waiting participant lists.
- `EventDetailsHeader`: title, image, creator, main metadata, and actions.
- `EventForm`: shared create/edit form.
- `EventFilters`: sport, level, language, and date filters.
- `EventSearchBar`: text search for event title or location.
- `JoinEventButton`: handles join action, loading, disabled, and result state.
- `LeaveEventButton`: handles leave action and queue update.
- `DeleteEventButton`: confirmation and delete action.

### Map And Geo Components

- `EventMap`: Leaflet map wrapper.
- `MapControls`: location search, reset, and map display settings.
- `MapMarkerPopup`: event popup content.
- `MapSidebar`: list of visible or nearby events.
- `MapStatus`: loading or error overlay for the map.
- `NearbyEventList`: event list filtered by current focus point.
- `LocationAutocomplete`: debounced geocoding search input.
- `LocationSuggestionList`: keyboard-friendly suggestions dropdown.
- `LocationPreview`: selected location label and address.

### Chat Components

- `EventChat`: complete chat container for one event.
- `EventChatPanel`: panel layout around message list and composer.
- `ChatEventSelector`: choose which event chat to open.
- `ChatMessageList`: chronological message list.
- `ChatMessage`: one message row with sender and timestamp.
- `ChatComposer`: text input and send action.

### Profile Components

- `ProfileCard`: user summary.
- `ProfileForm`: edit username, district, languages, and interests.
- `ProfileAvatarUploader`: avatar upload and preview.
- `UserSportsList`: preferred sports display.
- `UserLanguagesList`: preferred languages display.

### Landing Components

- `HeroSection`: first viewport with the core product promise and actions.
- `FeaturedEventsSection`: a small preview of active events.
- `HowItWorksSection`: concise onboarding steps.

### Development Components

- `ApiTester`: manual API request tester.
- `UiElementsPreview`: visual preview of shared components.

## Hooks

- `useAuth`: current user and auth actions.
- `useRequireAuth`: redirect or throw when auth is required.
- `useEvents`: fetch and refresh event lists.
- `useEvent`: fetch one event by id.
- `useEventActions`: join, leave, delete, and refresh event data.
- `useEventForm`: shared create/edit form state and validation.
- `useMyEvents`: split created, joined, and waitlisted events.
- `useGeoSearch`: debounced geocoding requests.
- `useLeaflet`: load Leaflet assets and initialize map safely.
- `useEventMarkers`: create and update markers for visible events.
- `useNearbyEvents`: calculate distance-based event filtering.
- `useEventMessages`: fetch messages for an event.
- `useEventChatSocket`: future WebSocket connection for live chat.
- `useProfile`: fetch and update profile data.
- `useDebouncedValue`: debounce text input.
- `useLocalStorage`: typed local storage state.
- `useMediaQuery`: responsive behavior in components.
- `useOnClickOutside`: close menus, popovers, and dropdowns.

## API Layer

Keep all network calls in `src/api`. UI components should not build raw URLs or know token details.

Recommended API modules:

- `client.ts`: base request function, token handling, JSON/FormData behavior.
- `errors.ts`: normalized API error type and parsing helpers.
- `endpoints.ts`: route constants if endpoints start repeating.
- `authApi.ts`: login, register, refresh, current user.
- `eventsApi.ts`: list, detail, create, update, delete, join, leave, messages.
- `geoApi.ts`: geocoding and map style.
- `chatApi.ts`: message history and future chat endpoints.
- `profileApi.ts`: profile read/update and avatar upload.

## Types

Recommended type split:

- `types/api.ts`: backend response types.
- `features/events/types.ts`: event-specific UI types, form types, filters.
- `types/common.ts`: generic UI utility types such as `LoadState`.
- `types/navigation.ts`: nav item and route metadata types.

Keep backend response types close to the API shape. Convert them into UI-friendly view models only when the UI benefits from it.

## Styling Strategy

Use one consistent styling strategy per component:

- Use Tailwind utility classes for layout, spacing, quick states, and responsive behavior.
- Use CSS modules for complex component-specific styling, Leaflet overrides, and styles that are hard to read inline.
- Keep global CSS for tokens, resets, typography defaults, theme variables, and third-party library overrides.
- Avoid large page-specific CSS files that quietly become design systems.

Suggested style files:

```txt
src/styles/
  global.css
  theme.css
  tailwind.css
```

Component-specific CSS modules should live next to the component:

```txt
features/events/components/EventCard.tsx
features/events/components/EventCard.module.css
```

## Internationalization

All user-visible text should use `react-i18next`.

Rules:

- Keep translation keys grouped by feature: `nav`, `common`, `auth`, `event`, `map`, `chat`, `profile`.
- Use interpolation with i18next syntax: `{{count}}`.
- Do not concatenate translated sentence fragments unless grammar is guaranteed in all supported languages.
- Add every new key to `en.json`, `de.json`, and `ua.json` in the same change.

Example:

```tsx
t("map.eventsNear", { count: visibleEvents.length })
```

```json
"eventsNear": "Events nearby ({{count}})"
```

## State Management

For the current project size, React state plus feature hooks is enough.

Use:

- Context for app-wide state: auth, theme, language if needed.
- Local state for form inputs and small UI state.
- Custom hooks for reusable async behavior.
- A data-fetching library later if caching, invalidation, pagination, and background refresh become painful.

Good candidates for future adoption:

- TanStack Query for server state.
- Zustand for small client-side global state.

## Routing

Keep routes centralized and typed where possible.

Recommended route files:

```txt
src/app/routes/routes.tsx
src/app/routes/ProtectedRoute.tsx
src/app/config/navigation.ts
```

Private routes should include:

- `/events/new`
- `/events/:eventId/edit`
- `/my-events`
- `/chats`
- `/profile`

Development-only routes should be hidden from production navigation:

- `/api-test`
- `/ui-elements-test`

## Error, Loading, And Empty States

Every data-driven page should handle:

- Initial loading.
- Empty result.
- API error.
- Unauthorized state.
- Forbidden action state.
- Slow network or disabled submit state.

Use shared components for this instead of one-off paragraphs on each page.

## Recommended Migration Plan

1. Create `features/events` and move `EventCard`, `EventForm`, event hooks, and event pages into it.
2. Create `components/shared` primitives for button, form fields, empty state, error state, and loading.
3. Move map logic from `MapPage` into `features/map/hooks` and `features/map/components`.
4. Move auth pages and forms into `features/auth`.
5. Split chat into `features/chat` components and hooks.
6. Add `ProtectedRoute` and protect authenticated pages.
7. Normalize API errors in `api/errors.ts`.
8. Replace repeated loading/error markup with shared states.
9. Review i18n keys and make all visible text translated.
10. Add tests for API helpers, form validation, and critical user flows.

## Minimum "Normal Frontend" Checklist

- Typed API layer.
- Thin pages.
- Domain features.
- Shared UI primitives.
- Reusable form components.
- Consistent loading, empty, and error states.
- Auth route protection.
- Responsive layout.
- i18n coverage for all visible text.
- Accessible controls with labels and keyboard support.
- Predictable styling rules.
- Development-only tools separated from production navigation.

