class SystemMessageService:
    def __init__(self):
        self.messages = []

    def add_message(self, msg: str):
        self.messages.append(msg)

    def get_all(self):
        return self.messages
