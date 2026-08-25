# Google OAuth Authentication

This document describes the Google authentication flow implemented by the application, including the backend OAuth/OIDC flow, frontend handoff, security boundaries, persistence, configuration, and failure handling.

The implementation uses:

* Google OAuth 2.0 Authorization Code Flow
* OpenID Connect (OIDC) for user identity
* PKCE for authorization-code protection
* Django REST Framework on the backend
* Google Auth / Google Auth OAuthlib libraries
* a short-lived one-time application login ticket
* application-owned access and refresh JWTs after authentication

The application does **not** use Google's access token as the application's login token.

---

## 1. Architecture

The authentication flow involves three parties:

```text
Browser / Frontend
        ?
        ?
        ?
Django Backend
        ?
        ? OAuth / OIDC
        ?
Google Identity Provider
```

Responsibilities are separated as follows.

### Browser / Frontend

The browser:

* initiates Google login,
* follows redirects to Google,
* returns to the backend callback through Google's redirect,
* receives a short-lived one-time application ticket,
* exchanges that ticket for the application's own JWT credentials.

The browser must never receive:

* `GOOGLE_OAUTH_CLIENT_SECRET`,
* Google's refresh token,
* internal OAuth state stored by Django.

### Django Backend

The backend:

* creates the Google authorization request,
* stores OAuth state and the PKCE verifier,
* validates the callback state,
* exchanges Google's authorization code,
* verifies the Google ID token,
* identifies or creates the local user,
* creates a short-lived one-time login ticket,
* exchanges that ticket for the application's access and refresh JWTs.

### Google

Google:

* authenticates the Google account,
* handles the Google login session and MFA,
* asks the user for consent where required,
* issues the authorization code,
* issues and signs the OIDC ID token,
* exposes public signing keys used to verify that token.

---

# 2. Relevant files

## Backend

```text
backend/accounts/google_auth.py
```

Contains the Google authentication flow:

* login start view,
* Google callback view,
* one-time ticket exchange view,
* Google OAuth flow construction,
* Google user lookup / creation logic,
* provider error handling.

```text
backend/accounts/models.py
```

Contains the local Google identity reference:

```text
User.google_sub
```

```text
backend/accounts/migrations/0006_user_google_sub.py
```

Creates the corresponding database field.

```text
backend/accounts/urls.py
```

Registers the Google authentication endpoints.

```text
backend/core/settings.py
```

Loads Google OAuth and frontend configuration.

```text
backend/requirements.txt
```

Contains the Google OAuth dependencies.

```text
docker-compose.yml
```

Passes the required OAuth environment variables into the backend service.

---

## Frontend

```text
frontend/src/api/authApi.ts
```

Contains:

* the Google login-start URL,
* the application ticket exchange API call.

```text
frontend/src/pages/auth/LoginPage.tsx
```

Starts Google authentication by navigating the browser to the backend login endpoint.

```text
frontend/src/pages/auth/GoogleCallbackPage.tsx
```

Receives the temporary application ticket and exchanges it for application JWT credentials.

```text
frontend/src/features/auth/AuthContext.tsx
```

Completes the application login after the ticket exchange and stores the resulting authentication state.

```text
frontend/src/app/App.tsx
```

Registers the frontend Google callback route.

---

# 3. Google Cloud configuration

A Google OAuth client of type:

```text
Web application
```

must be configured.

The Google client configuration provides:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
```

The backend callback URI must also be registered in Google as an authorized redirect URI.

Example:

```text
https://example.com/api/auth/google/callback/
```

For local development this may instead be something such as:

```text
http://localhost:8000/api/auth/google/callback/
```

The redirect URI sent during the OAuth flow must match the URI configured in Google.

---

# 4. Application configuration

The backend expects:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
FRONTEND_URL
```

These are loaded in:

```text
backend/core/settings.py
```

and passed to the backend container through:

```text
docker-compose.yml
```

Example environment configuration:

```text
GOOGLE_OAUTH_CLIENT_ID=<google-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
FRONTEND_URL=http://localhost:5173
```

The client secret must never be committed to the repository or exposed to the frontend.

---

# 5. Backend endpoints

The backend exposes three Google authentication endpoints.

```text
GET /api/auth/google/start/
```

Starts authentication.

```text
GET /api/auth/google/callback/
```

Receives Google's authorization callback.

```text
POST /api/auth/google/exchange/
```

Exchanges the application's temporary one-time ticket for the application's own JWT credentials.

These endpoints are registered in:

```text
backend/accounts/urls.py
```

---

# 6. Full authentication flow

## Step 1 Ñ User starts Google login

The user clicks:

```text
Continue with Google
```

on:

```text
frontend/src/pages/auth/LoginPage.tsx
```

The frontend navigates the browser to:

```text
GET /api/auth/google/start/
```

This is a normal browser navigation, not an AJAX token request.

---

# 7. Backend creates the OAuth authorization request

The backend constructs the Google OAuth flow.

It generates security values including:

```text
state
PKCE code_verifier
PKCE code_challenge
```

The backend stores the values required after Google's redirect in the Django session.

Conceptually:

```text
Django session
??? google_oauth_state
??? google_oauth_code_verifier
```

The authorization request sent to Google contains values such as:

```text
client_id
redirect_uri
response_type=code
scope
state
code_challenge
code_challenge_method
```

The browser is then redirected to Google's authorization endpoint.

---

# 8. OAuth `state`

`state` protects the OAuth transaction against login CSRF and callback substitution.

Before redirecting to Google:

```text
state = random value
```

Django stores it in the user's session.

Google later returns the same value:

```text
/api/auth/google/callback/?code=...&state=...
```

The callback compares:

```text
returned state
        ==
state stored in Django session
```

If the values do not match, authentication is rejected.

The stored state is removed using single-use semantics.

Conceptually:

```text
request.session.pop("google_oauth_state", None)
```

Therefore the same OAuth state cannot successfully be reused for another callback.

OAuth `state` is separate from Django's regular CSRF token.

---

# 9. PKCE

The implementation also uses PKCE.

PKCE introduces:

```text
code_verifier
```

and a derived:

```text
code_challenge
```

The authorization request sends the challenge to Google.

The original verifier remains temporarily stored in the Django session.

When the callback exchanges the authorization code, Django restores the verifier onto the OAuth flow.

Conceptually:

```text
authorization request:
    code_challenge

callback/token exchange:
    code_verifier
```

This makes an intercepted authorization code insufficient by itself.

---

# 10. Google authentication

The browser is redirected to Google.

Google is responsible for:

* selecting the Google account,
* authenticating the user,
* passwords,
* passkeys,
* MFA,
* existing Google sessions,
* consent.

The application never receives the user's Google password.

After successful authentication and authorization, Google creates a short-lived:

```text
authorization code
```

This authorization code is not an access token and is not the application's login session.

---

# 11. Google callback

Google redirects the browser to:

```text
GET /api/auth/google/callback/
```

with parameters such as:

```text
code
state
```

Example:

```text
/api/auth/google/callback/?code=<authorization-code>&state=<state>
```

The browser also sends its existing Django session cookie, allowing Django to recover the previously stored OAuth state and PKCE verifier.

---

# 12. State validation

The callback first consumes the expected OAuth state from the Django session.

If:

```text
expected state is missing
```

or:

```text
returned state != expected state
```

the callback rejects authentication.

The PKCE verifier is also removed from temporary session storage.

Both therefore have single-use behavior.

---

# 13. Authorization-code exchange

After successful state validation, Django calls:

```text
flow.fetch_token(...)
```

The backend sends the authorization code directly to Google's token endpoint.

This communication is:

```text
Django ? Google
```

and does not expose the Google client secret to the browser.

The exchange uses information including:

```text
authorization code
client_id
client_secret
redirect_uri
PKCE code_verifier
```

Google validates the OAuth transaction and returns credentials.

---

# 14. OAuth exchange errors

OAuth protocol failures are handled separately from provider/network failures.

Examples of OAuth protocol failures include:

```text
invalid authorization code
expired authorization code
invalid client
invalid grant
OAuth request rejection
```

These are represented by OAuthlib errors derived from:

```text
OAuth2Error
```

They are converted into a controlled authentication failure.

Conceptually:

```text
OAuth2Error
    ?
403 AuthenticationFailed
```

The user is not created and no application login ticket is issued.

---

# 15. Google transport failures

Communication with Google's token endpoint can also fail because Google cannot currently be reached.

Examples:

```text
connection failure
timeout
temporary provider outage
```

These are not treated as invalid user credentials.

Requests transport failures are mapped to:

```text
503 Service Unavailable
```

through the application-specific:

```text
GoogleProviderUnavailable
```

exception.

Conceptually:

```text
RequestException
        ?
GoogleProviderUnavailable
        ?
503
```

This distinction is intentional:

```text
Google rejected authentication
        ­
Google could not be reached
```

---

# 16. Google ID token

After the authorization-code exchange, the backend receives Google's OIDC ID token.

Conceptually:

```text
flow.credentials.id_token
```

An ID token is a signed JWT containing identity claims such as:

```text
iss
aud
sub
email
email_verified
iat
exp
```

The ID token is not trusted merely because it was returned by the OAuth flow.

It must be cryptographically verified.

---

# 17. ID-token verification

The backend verifies the ID token using:

```text
id_token.verify_oauth2_token(...)
```

with:

```text
flow.credentials.id_token
GoogleRequest()
GOOGLE_OAUTH_CLIENT_ID
```

Conceptually:

```text
verify_oauth2_token(
    ID token,
    Google HTTP transport,
    expected audience
)
```

Verification checks the token's authenticity and intended recipient.

---

# 18. Signature verification

Google signs ID tokens using Google's private signing keys.

The token contains:

```text
HEADER.PAYLOAD.SIGNATURE
```

The JWT header contains a signing-key identifier such as:

```text
kid
```

Google publishes the corresponding public signing keys.

The verification library obtains Google's public keys and verifies that the signature matches:

```text
header + payload
```

A valid signature proves that the token was created using a Google-controlled signing key and that the signed contents were not modified afterward.

The application never receives Google's private signing key.

---

# 19. Audience validation

The ID token contains:

```text
aud
```

The audience identifies the OAuth client for which the token was issued.

The backend passes:

```text
GOOGLE_OAUTH_CLIENT_ID
```

to the verification function.

Therefore:

```text
claims["aud"]
```

must correspond to this application's configured Google client.

This prevents accepting a legitimate Google ID token that was issued for another application.

---

# 20. Issuer validation

The token also contains:

```text
iss
```

which identifies the token issuer.

The verification process ensures the token was issued by Google.

A correctly signed token with an unacceptable issuer must still be rejected.

---

# 21. Expiration validation

The token contains:

```text
exp
```

which determines when the token expires.

Expired ID tokens are rejected during verification.

---

# 22. ID-token verification errors

The verification layer distinguishes invalid identity data from provider availability.

Normal verification failures such as malformed or otherwise invalid tokens can raise:

```text
ValueError
```

Google authentication verification failures can raise:

```text
GoogleAuthError
```

These result in:

```text
403 AuthenticationFailed
```

A Google transport failure while retrieving signing information is treated as provider unavailability instead and results in:

```text
503 Service Unavailable
```

The application does not use broad `except Exception` handling here because doing so could hide application programming errors.

---

# 23. Google `sub`

The most important identity claim is:

```text
sub
```

`sub` means:

```text
subject
```

and identifies the Google account.

The application stores this value as:

```text
User.google_sub
```

The field is:

```text
nullable
unique
```

so users without Google authentication remain valid, while a Google identity cannot be linked to multiple local users.

Conceptually:

```text
Google account
sub = 123456789
        ?
        ?
Application User
google_sub = 123456789
```

The Google subject is used as the stable external identity identifier.

Email is not used as the permanent Google identity key.

---

# 24. Email verification

The callback requires:

```text
email_verified = true
```

before using the Google email for account creation/linking.

An unverified Google email causes authentication to be rejected.

---

# 25. Existing Google identity

If a user already exists with:

```text
google_sub == claims["sub"]
```

that existing application user is reused.

This remains true even if the email returned by Google later changes.

Conceptually:

```text
same Google sub
different/new email
        ?
same local user
```

---

# 26. Existing local account linking

If there is no existing user with the Google `sub`, the implementation may find an existing local account with the verified Google email.

The Google identity can then be attached to that existing account.

The existing local password remains valid.

Conceptually:

```text
existing local account
person@example.com
        +
verified Google identity
person@example.com
        ?
same application user
google_sub added
```

This avoids creating duplicate users for the same existing account.

---

# 27. Conflicting Google identities

If an existing account is already linked to one Google subject, it must not silently be reassigned to another Google subject.

Conceptually:

```text
User
google_sub = GOOGLE_A

new login:
same email
google_sub = GOOGLE_B
```

must be rejected rather than overwriting the existing identity.

---

# 28. Google-only users

When a completely new user is created through Google authentication, the account does not receive a usable local password automatically.

The Google identity is therefore the authentication method for that newly created account unless another password flow is explicitly implemented later.

---

# 29. Why the backend does not redirect with application JWTs

After successful Google authentication, the backend does **not** redirect the browser with:

```text
access=<JWT>
refresh=<JWT>
```

in the URL.

Tokens in URLs are risky because URLs may appear in:

* browser history,
* logs,
* proxy logs,
* analytics,
* screenshots,
* referrer information.

Instead, the application creates a random one-time login ticket.

---

# 30. One-time login ticket

After a valid Google identity has been mapped to a local user, Django creates:

```text
ticket = secrets.token_urlsafe(...)
```

The backend stores:

```text
google-login:<ticket> ? user ID
```

in the Django cache.

The ticket has a short timeout.

Current design:

```text
timeout = 60 seconds
```

Conceptually:

```text
google-login:abc123
        ?
User ID 42
```

The ticket itself does not contain the user ID or application JWTs.

---

# 31. Frontend callback redirect

After creating the ticket, Django redirects to:

```text
FRONTEND_URL/auth/google/callback?ticket=<ticket>
```

Example:

```text
http://localhost:5173/auth/google/callback?ticket=abc123
```

The frontend route is implemented by:

```text
frontend/src/pages/auth/GoogleCallbackPage.tsx
```

---

# 32. Frontend callback behavior

`GoogleCallbackPage` reads:

```text
ticket
```

from the query string.

If no ticket exists, the user is redirected back to:

```text
/login
```

If the ticket exists, the page calls:

```text
completeGoogleLogin(ticket)
```

The callback is guarded so the exchange does not intentionally execute multiple times from the component lifecycle.

While the exchange is running, the frontend shows the localized:

```text
auth.completingGoogleLogin
```

message.

If the exchange fails, it shows:

```text
auth.googleLoginFailed
```

The frontend intentionally does not expose raw backend exception messages as the primary user-facing error.

---

# 33. Application ticket exchange

The frontend calls:

```text
POST /api/auth/google/exchange/
```

with:

```json
{
  "ticket": "<one-time-ticket>"
}
```

The backend looks up:

```text
google-login:<ticket>
```

in the cache.

If the ticket does not exist or has expired, authentication is rejected.

---

# 34. Single-use ticket semantics

The ticket is consumed during the exchange.

Once used successfully, its cache entry is removed.

Conceptually:

```text
ticket exists
    ?
exchange
    ?
ticket deleted
    ?
application JWTs issued
```

Trying to use the same ticket again fails.

This protects against ticket replay.

---

# 35. Inactive users

Even a valid one-time ticket does not allow an inactive application user to authenticate.

If:

```text
user.is_active == false
```

the exchange is rejected.

The ticket must not remain reusable afterward.

---

# 36. Application JWT issuance

After the ticket has been successfully resolved to an active application user, the backend issues the application's normal JWT credentials.

The response contains application credentials such as:

```text
access
refresh
user
```

These are the application's authentication tokens.

They are **not Google OAuth access or refresh tokens**.

Conceptually:

```text
Google authentication
        ?
Google identity verified
        ?
one-time ticket
        ?
ticket exchange
        ?
Application access JWT
Application refresh JWT
```

After this point the application's existing JWT authentication system is used.

Google does not need to be contacted for every authenticated API request.

---

# 37. Frontend authentication state

`AuthContext.tsx` exposes:

```text
completeGoogleLogin(ticket)
```

The function:

1. exchanges the ticket,
2. receives the application access and refresh tokens,
3. stores them using the application's normal token mechanism,
4. updates the authenticated user,
5. completes navigation into the authenticated application.

After successful exchange, the callback page navigates to:

```text
/discover
```

using:

```text
replace: true
```

This removes the ticket-bearing callback page from normal browser history.

---

# 38. Google access and refresh tokens

The current flow uses Google for authentication.

If the application does not subsequently call Google APIs on behalf of the user, there is no reason to persist Google's access or refresh tokens.

The important Google result for login is the verified identity:

```text
sub
email
email_verified
```

The application's own JWT system then handles application authorization.

If Google APIs such as Drive, Calendar, or Gmail are introduced later, Google token storage must be designed separately.

Google refresh tokens must never be exposed to the frontend.

---

# 39. Security boundaries

The implementation intentionally separates several different security mechanisms.

## OAuth state

Protects the OAuth login transaction:

```text
state
```

## PKCE

Protects the authorization code:

```text
code_verifier
code_challenge
```

## Google ID-token signature

Proves the signed token was produced by Google and has not been modified.

## Audience

Proves the token was intended for this application's configured Google OAuth client.

## Google `sub`

Provides the stable Google identity.

## One-time login ticket

Safely transfers successful backend authentication back to the frontend without putting application JWTs in the redirect URL.

## Application JWT

Authenticates subsequent requests to this application.

These mechanisms solve different problems and should not be treated as interchangeable.

---

# 40. Data storage summary

| Value                   | Browser                             | Django session/cache/DB | Google                    |
| ----------------------- | ----------------------------------- | ----------------------- | ------------------------- |
| Google password         | Google page only                    | No                      | Yes                       |
| Google client ID        | Visible                             | Configuration           | Registered                |
| Google client secret    | Never                               | Secret configuration    | Registered                |
| OAuth state             | Transported                         | Temporary session       | Echoed                    |
| PKCE verifier           | No direct persistence               | Temporary session       | Validated during exchange |
| Authorization code      | Temporarily transported             | Immediately consumed    | Issued                    |
| Google ID token         | Backend processing                  | Normally verify/use     | Issued                    |
| Google `sub`            | Not required                        | Database                | Issued as claim           |
| Google email            | May appear through application data | Database if required    | Issued as claim           |
| One-time login ticket   | Temporary URL                       | Cache                   | No                        |
| Application access JWT  | Frontend auth storage               | Issued by backend       | No                        |
| Application refresh JWT | Frontend auth storage               | Issued by backend       | No                        |

---

# 41. Failure behavior

Expected high-level failure semantics:

```text
Missing OAuth state
    ? 403

Mismatched OAuth state
    ? 403

Reused OAuth state
    ? 403

Google OAuth protocol rejection
    ? 403

Invalid Google ID token
    ? 403

Invalid Google issuer
    ? 403

Unverified Google email
    ? 403

Google token endpoint unavailable
    ? 503

Google signing-key service unavailable
    ? 503

Invalid / expired one-time ticket
    ? 403

Reused one-time ticket
    ? 403

Inactive application account
    ? 403
```

Unexpected programming errors should not be swallowed by broad OAuth exception handling.

---

# 42. Authentication flow summary

The complete flow can be summarized as:

```text
User
 ?
 ? Click "Continue with Google"
 ?
Frontend LoginPage
 ?
 ? navigate browser
 ?
GET /api/auth/google/start/
 ?
 ? create state
 ? create PKCE verifier/challenge
 ? store temporary session data
 ?
Google authorization endpoint
 ?
 ? Google account authentication
 ? consent
 ?
Google authorization code
 ?
 ? redirect
 ?
GET /api/auth/google/callback/
 ?
 ? consume + validate state
 ? restore PKCE verifier
 ?
 ? exchange authorization code
 ?
Google token endpoint
 ?
 ? return ID token
 ?
Django
 ?
 ? verify signature
 ? verify audience
 ? verify issuer
 ? verify expiration
 ? verify email
 ? identify user using sub
 ?
 ? create random one-time ticket
 ? cache ticket ? user ID
 ?
Frontend GoogleCallbackPage
 ?
 ? POST ticket
 ?
/api/auth/google/exchange/
 ?
 ? consume ticket
 ? verify active user
 ? issue application JWTs
 ?
AuthContext
 ?
 ? store application credentials
 ?
/discover
```

---

# 43. Important implementation rules

The following rules should remain true as the authentication implementation evolves:

1. Never expose `GOOGLE_OAUTH_CLIENT_SECRET` to frontend code.
2. Never trust an ID token without verifying it.
3. Always validate the ID-token audience against the configured Google client ID.
4. Use Google's `sub` as the stable external identity.
5. Do not use email as the permanent Google identity key.
6. Require verified Google email before email-based account linking.
7. Do not overwrite an existing different `google_sub`.
8. Keep OAuth state single-use.
9. Keep PKCE enabled.
10. Keep the frontend handoff ticket short-lived and single-use.
11. Do not place application access or refresh JWTs in redirect URLs.
12. Distinguish authentication failures from Google/provider outages.
13. Do not catch broad exceptions around the OAuth flow.
14. Do not store Google access/refresh tokens unless Google API access is actually required.
15. Do not commit OAuth secrets into the repository.

---

# 44. Development notes

The Google OAuth configuration must correspond to the environment in which the application is running.

In particular:

```text
GOOGLE_OAUTH_REDIRECT_URI
```

must match the callback address registered with Google.

When changing:

* hostname,
* port,
* HTTP vs HTTPS,
* callback path,
* deployment domain,

the Google OAuth configuration may also need to be updated.

The application should use HTTPS in deployed environments.

---

# 45. Future extensions

Possible future extensions should be treated separately from the current login flow.

Examples include:

* storing multiple external identity providers per user,
* moving Google identities into a dedicated social-identity table,
* Google API authorization,
* Google refresh-token persistence,
* explicit account linking/unlinking UI,
* multiple Google OAuth client IDs,
* certificate/JWK caching,
* full browser-level OAuth end-to-end testing.

These are not required for the current Google sign-in implementation.
