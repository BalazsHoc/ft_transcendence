from django.test import SimpleTestCase

from .services import (
    GeoSuggestion,
    _normalize_response,
    _suggestion_from_nominatim,
    build_search_queries,
)


class GeoSearchOrderingTests(SimpleTestCase):
    def test_vienna_query_is_requested_before_the_fallback(self):
        self.assertEqual(
            build_search_queries("Innstraße"),
            ["Innstraße Wien", "Innstraße"],
        )

    def test_vienna_results_are_sorted_before_other_countries(self):
        vienna = GeoSuggestion(
            id="vienna",
            label="Innstraße",
            address="Innstraße 25, Wien, Österreich",
            latitude=48.24,
            longitude=16.38,
            source="test",
            raw={"address": {"city": "Wien", "country_code": "at"}},
        )
        other = GeoSuggestion(
            id="other",
            label="Innstraße",
            address="Innstraße 25, Berlin, Deutschland",
            latitude=52.52,
            longitude=13.4,
            source="test",
            raw={"address": {"city": "Berlin", "country_code": "de"}},
        )

        response = _normalize_response(
            provider="test",
            query="Innstraße",
            language="de",
            suggestions=[other, vienna],
        )

        self.assertEqual(response["results"][0]["id"], "vienna")

    def test_nominatim_label_is_the_street_and_address_stays_full(self):
        suggestion = _suggestion_from_nominatim(
            {
                "place_id": 1,
                "lat": "48.24",
                "lon": "16.38",
                "display_name": "Innstraße 25, 1200 Wien, Österreich",
                "address": {"road": "Innstraße", "house_number": "25"},
            }
        )

        self.assertEqual(suggestion.label, "Innstraße")
        self.assertEqual(
            suggestion.address,
            "Innstraße 25, 1200 Wien, Österreich",
        )
