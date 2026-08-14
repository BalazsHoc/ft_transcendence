from drf_spectacular.extensions import OpenApiAuthenticationExtension


class PublicAPIKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "public_api.authentication.PublicAPIKeyAuthentication"
    name = "PublicApiKeyAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key issued by the backend management command.",
        }
