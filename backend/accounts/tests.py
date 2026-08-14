from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


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
