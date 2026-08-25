from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from oauthlib.oauth2 import OAuth2Error
from requests.exceptions import ConnectionError as RequestsConnectionError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APITestCase

from .google_auth import find_or_create_google_user


class AuthenticationApiTests(APITestCase):
    def test_registration_requires_matching_passwords_and_valid_district(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'Alex@Example.com',
                'name': 'Alex Example',
                'password': 'secure-password-123',
                'password_confirm': 'secure-password-321',
                'district': '1010',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('password_confirm', response.data)

        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'Alex@Example.com',
                'name': 'Alex Example',
                'password': 'secure-password-123',
                'password_confirm': 'secure-password-123',
                'district': '9999',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('district', response.data)

        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'alex@example.com',
                'name': 'Alex Example',
                'password': '1234567',
                'password_confirm': '1234567',
                'district': '1010',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)

    def test_registration_hashes_password_and_email_login_works(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'Alex@Example.com',
                'name': 'Alex Example',
                'password': 'secure-password-123',
                'password_confirm': 'secure-password-123',
                'district': '1010',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(email='alex@example.com')
        self.assertEqual(user.first_name, 'Alex Example')
        self.assertEqual(user.district, '1010')
        self.assertNotEqual(user.password, 'secure-password-123')
        self.assertTrue(user.check_password('secure-password-123'))
        self.assertNotEqual(user.username, user.email)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        login = self.client.post(
            '/api/auth/login/',
            {'email': ' ALEX@EXAMPLE.COM ', 'password': 'secure-password-123'},
            format='json',
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        get_user_model().objects.create_user(
            username='existing',
            email='existing@example.com',
            password='secure-password-123',
        )

        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'EXISTING@example.com',
                'name': 'Another User',
                'password': 'secure-password-123',
                'password_confirm': 'secure-password-123',
                'district': '1020',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)


@override_settings(
    GOOGLE_OAUTH_CLIENT_ID='google-client-id',
    GOOGLE_OAUTH_CLIENT_SECRET='google-client-secret',
    GOOGLE_OAUTH_REDIRECT_URI='http://testserver/api/auth/google/callback/',
    FRONTEND_URL='http://frontend.test',
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'google-auth-tests',
        }
    },
)
class GoogleAuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_google_login_start_stores_state_and_pkce_verifier(self):
        flow = Mock()
        flow.authorization_url.return_value = (
            'https://accounts.google.test/authorize',
            'generated-state',
        )
        flow.code_verifier = 'generated-code-verifier'

        with patch('accounts.google_auth.build_google_flow', return_value=flow):
            response = self.client.get('/api/auth/google/start/')

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            'https://accounts.google.test/authorize',
        )
        self.assertEqual(
            self.client.session['google_oauth_state'],
            'generated-state',
        )
        self.assertEqual(
            self.client.session['google_oauth_code_verifier'],
            'generated-code-verifier',
        )

    def test_google_callback_rejects_missing_or_mismatched_state(self):
        response = self.client.get(
            '/api/auth/google/callback/?state=unexpected&code=code',
        )
        self.assertEqual(response.status_code, 403)

        session = self.client.session
        session['google_oauth_state'] = 'expected'
        session['google_oauth_code_verifier'] = 'verifier'
        session.save()

        response = self.client.get(
            '/api/auth/google/callback/?state=unexpected&code=code',
        )
        self.assertEqual(response.status_code, 403)

    def test_google_callback_creates_single_use_ticket(self):
        session = self.client.session
        session['google_oauth_state'] = 'expected-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.credentials = SimpleNamespace(id_token='signed-id-token')
        claims = {
            'sub': 'google-subject',
            'email': 'NEW@EXAMPLE.COM',
            'email_verified': True,
            'name': 'New Person',
            'given_name': 'New',
            'family_name': 'Person',
        }

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.id_token.verify_oauth2_token',
                return_value=claims,
            ) as verify_token,
            patch(
                'accounts.google_auth.secrets.token_urlsafe',
                return_value='one-time-ticket',
            ),
        ):
            response = self.client.get(
                '/api/auth/google/callback/?state=expected-state&code=code',
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            'http://frontend.test/auth/google/callback?ticket=one-time-ticket',
        )
        flow.fetch_token.assert_called_once()
        self.assertEqual(flow.code_verifier, 'code-verifier')
        verify_token.assert_called_once()

        user = get_user_model().objects.get(google_sub='google-subject')
        self.assertEqual(user.email, 'new@example.com')
        self.assertFalse(user.has_usable_password())
        self.assertEqual(cache.get('google-login:one-time-ticket'), str(user.pk))

    def test_google_callback_rejects_unverified_email(self):
        session = self.client.session
        session['google_oauth_state'] = 'expected-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.credentials = SimpleNamespace(id_token='signed-id-token')

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.id_token.verify_oauth2_token',
                return_value={
                    'sub': 'google-subject',
                    'email': 'new@example.com',
                    'email_verified': False,
                },
            ),
        ):
            response = self.client.get(
                '/api/auth/google/callback/?state=expected-state&code=code',
            )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(
            get_user_model().objects.filter(google_sub='google-subject').exists()
        )

    def test_google_callback_rejects_id_token_verification_failure(self):
        session = self.client.session
        session['google_oauth_state'] = 'expected-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.credentials = SimpleNamespace(id_token='invalid-id-token')

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.id_token.verify_oauth2_token',
                side_effect=ValueError('invalid token'),
            ),
            patch(
                'accounts.google_auth.secrets.token_urlsafe',
                return_value='failure-ticket',
            ) as create_ticket,
        ):
            response = self.client.get(
                '/api/auth/google/callback/?state=expected-state&code=code',
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(get_user_model().objects.count(), 0)
        create_ticket.assert_not_called()
        self.assertIsNone(cache.get('google-login:failure-ticket'))

    def test_google_callback_handles_token_endpoint_transport_failure(self):
        session = self.client.session
        session['google_oauth_state'] = 'expected-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.fetch_token.side_effect = RequestsConnectionError(
            'Google token endpoint unavailable'
        )

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.secrets.token_urlsafe',
                return_value='failure-ticket',
            ) as create_ticket,
        ):
            response = self.client.get(
                '/api/auth/google/callback/?state=expected-state&code=code',
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(get_user_model().objects.count(), 0)
        create_ticket.assert_not_called()
        self.assertIsNone(cache.get('google-login:failure-ticket'))

    def test_google_callback_rejects_token_exchange_failure(self):
        session = self.client.session
        session['google_oauth_state'] = 'expected-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.fetch_token.side_effect = OAuth2Error('token exchange failed')

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.secrets.token_urlsafe',
                return_value='failure-ticket',
            ) as create_ticket,
        ):
            response = self.client.get(
                '/api/auth/google/callback/?state=expected-state&code=code',
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(get_user_model().objects.count(), 0)
        create_ticket.assert_not_called()
        self.assertIsNone(cache.get('google-login:failure-ticket'))

    def test_google_callback_state_is_single_use(self):
        session = self.client.session
        session['google_oauth_state'] = 'single-use-state'
        session['google_oauth_code_verifier'] = 'code-verifier'
        session.save()

        flow = Mock()
        flow.credentials = SimpleNamespace(id_token='signed-id-token')
        claims = {
            'sub': 'google-subject',
            'email': 'person@example.com',
            'email_verified': True,
        }

        with (
            patch('accounts.google_auth.build_google_flow', return_value=flow),
            patch(
                'accounts.google_auth.id_token.verify_oauth2_token',
                return_value=claims,
            ),
            patch(
                'accounts.google_auth.secrets.token_urlsafe',
                return_value='one-time-ticket',
            ),
        ):
            first_response = self.client.get(
                '/api/auth/google/callback/?state=single-use-state&code=code',
            )
            self.assertNotIn('google_oauth_state', self.client.session)
            self.assertNotIn('google_oauth_code_verifier', self.client.session)

            second_response = self.client.get(
                '/api/auth/google/callback/?state=single-use-state&code=code',
            )

        self.assertEqual(first_response.status_code, 302)
        self.assertEqual(second_response.status_code, 403)
        self.assertEqual(flow.fetch_token.call_count, 1)

    def test_google_identity_is_reused_even_if_email_changes(self):
        user = get_user_model().objects.create_user(
            username='google-user',
            email='old@example.com',
            google_sub='stable-google-subject',
        )

        found = find_or_create_google_user(
            {
                'sub': 'stable-google-subject',
                'email': 'new@example.com',
            }
        )

        self.assertEqual(found.pk, user.pk)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_verified_email_links_an_existing_local_account(self):
        user = get_user_model().objects.create_user(
            username='local-user',
            email='person@example.com',
            password='secure-password-123',
        )

        found = find_or_create_google_user(
            {
                'sub': 'new-google-subject',
                'email': ' PERSON@EXAMPLE.COM ',
            }
        )

        self.assertEqual(found.pk, user.pk)
        user.refresh_from_db()
        self.assertEqual(user.google_sub, 'new-google-subject')
        self.assertTrue(user.check_password('secure-password-123'))

    def test_existing_email_cannot_be_linked_to_a_different_google_subject(self):
        get_user_model().objects.create_user(
            username='linked-user',
            email='person@example.com',
            google_sub='original-google-subject',
        )

        with self.assertRaises(AuthenticationFailed):
            find_or_create_google_user(
                {
                    'sub': 'different-google-subject',
                    'email': 'person@example.com',
                }
            )

    def test_google_ticket_exchange_returns_tokens_and_prevents_replay(self):
        user = get_user_model().objects.create_user(
            username='google-user',
            email='person@example.com',
            google_sub='google-subject',
        )
        cache.set('google-login:valid-ticket', str(user.pk), timeout=60)

        response = self.client.post(
            '/api/auth/google/exchange/',
            {'ticket': 'valid-ticket'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['id'], str(user.pk))
        self.assertIsNone(cache.get('google-login:valid-ticket'))

        replay = self.client.post(
            '/api/auth/google/exchange/',
            {'ticket': 'valid-ticket'},
            format='json',
        )
        self.assertEqual(replay.status_code, 403)

    def test_google_ticket_exchange_rejects_invalid_or_expired_ticket(self):
        response = self.client.post(
            '/api/auth/google/exchange/',
            {'ticket': 'missing-ticket'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)

    def test_google_ticket_exchange_rejects_missing_ticket(self):
        response = self.client.post(
            '/api/auth/google/exchange/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)

    def test_google_ticket_exchange_rejects_inactive_account(self):
        user = get_user_model().objects.create_user(
            username='inactive-google-user',
            email='inactive@example.com',
            google_sub='inactive-google-subject',
            is_active=False,
        )
        cache.set('google-login:inactive-ticket', str(user.pk), timeout=60)

        response = self.client.post(
            '/api/auth/google/exchange/',
            {'ticket': 'inactive-ticket'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(cache.get('google-login:inactive-ticket'))
