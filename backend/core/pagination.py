from rest_framework.pagination import PageNumberPagination


class AppPagination(PageNumberPagination):
    """Default pagination for the application list endpoints."""

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100
