from rest_framework.test import APITestCase

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
