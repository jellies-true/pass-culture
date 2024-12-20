from flask import current_app

from pcapi.repository import atomic
from pcapi.utils.health_checker import check_database_connection
from pcapi.utils.health_checker import read_version_from_file


@current_app.route("/health/api", methods=["GET"])
@atomic()
def health_api() -> tuple[str, int]:
    output = read_version_from_file()
    return output, 200


@current_app.route("/health/database", methods=["GET"])
@atomic()
def health_database() -> tuple[str, int]:
    database_working = check_database_connection()
    return_code = 200 if database_working else 500
    output = read_version_from_file()
    return output, return_code
