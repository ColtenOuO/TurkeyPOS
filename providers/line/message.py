import request
from providers.config import settings

class LineMessage:
    def __init__(self, channel_secret: str=settings.CHANNEL_SECRET, channel_id: str=settings.CHANNEL_ID):
        self.channel_secret = channel_secret
        self.channel_id = channel_id

    def send_line_message(token, message):
        url = "https://api.line.me/v2/bot/message/push"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        payload = {
            "to": "<USER_ID>",
            "messages": [message]
        }

        try:
            response = request.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
        except request.exceptions.RequestException as e:
            print(f"Error sending message: {e}")
            return None