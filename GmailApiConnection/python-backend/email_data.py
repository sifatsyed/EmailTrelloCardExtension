class Email_Data:
    def __init__(self, id, threadId, labelIds, snippet):
        self.id = id
        self.threadId = threadId
        self.labelIds = labelIds
        self.snippet = snippet

    def __str__(self) -> str:
        return f"{self.id} - Labels: {self.labelIds}, ThreadId: {self.threadId}, Body Snippet: {self.snippet}"