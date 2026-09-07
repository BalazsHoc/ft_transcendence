from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APITestCase
from rest_framework import serializers

from accounts.serializers import MeSerializer
from events.serializers import EventSerializer
from groups.serializers import GroupSerializer
from .upload_limits import MAX_IMAGE_SIZE_BYTES, image_size_error

from .sports import SPORT_CODES
from .districts import DISTRICT_CODES


class SportsCatalogTests(APITestCase):
    def test_sports_catalog_returns_all_supported_codes(self):
        response = self.client.get("/api/meta/sports/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["code"] for item in response.data], list(SPORT_CODES))
        self.assertEqual(len(response.data), 20)


class DistrictCatalogTests(APITestCase):
    def test_district_catalog_returns_all_vienna_districts(self):
        response = self.client.get('/api/meta/districts/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['code'] for item in response.data], list(DISTRICT_CODES))
        self.assertEqual(len(response.data), 23)


class ImageUploadLimitTests(SimpleTestCase):
    def test_images_at_limit_are_allowed_and_oversized_images_are_rejected(self):
        allowed = SimpleUploadedFile(
            "allowed.jpg",
            b"x" * MAX_IMAGE_SIZE_BYTES,
            content_type="image/jpeg",
        )
        oversized = SimpleUploadedFile(
            "oversized.jpg",
            b"x" * (MAX_IMAGE_SIZE_BYTES + 1),
            content_type="image/jpeg",
        )

        self.assertIsNone(image_size_error(allowed))
        self.assertIsNotNone(image_size_error(oversized))

        for serializer, validator_name in (
            (MeSerializer(), "validate_avatar"),
            (EventSerializer(), "validate_image"),
            (GroupSerializer(), "validate_cover_image"),
        ):
            with self.assertRaises(serializers.ValidationError):
                getattr(serializer, validator_name)(oversized)
