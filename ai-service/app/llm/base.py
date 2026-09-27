from abc import ABC, abstractmethod
from typing import List
from app.models.schemas import ChatMessage

class BaseLLMProvider(ABC):
    """
    Abstract Base Class for LLM providers.
    Ensures decoupled, provider-agnostic interface across Gemini, OpenAI, or local models.
    """

    @abstractmethod
    async def generate_response(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ) -> str:
        """
        Generate text response given message sequence.
        """
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return active model name string."""
        pass
