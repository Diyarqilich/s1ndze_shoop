from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        data = response.data
        if isinstance(data, dict) and "detail" in data:
            response.data = {
                "error": True,
                "status_code": response.status_code,
                "message": str(data["detail"]),
                "details": data,
            }
        else:
            response.data = {
                "error": True,
                "status_code": response.status_code,
                "message": "Validation error",
                "details": data,
            }
    return response
