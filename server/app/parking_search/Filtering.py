import datetime
import ZoneInfo
import requests


# Filtering by timeframe


# Establishing current time and timezone

response = requests.get("https://ip-api.com", timeout=5).json()
iana_tz = response.get("timezone", "UTC")

Local_time = datetime.now(ZoneInfo(iana_tz)
