import logging
import httpx
from typing import List
from app.llm.base import BaseLLMProvider
from app.models.schemas import ChatMessage
from app.config.settings import settings

logger = logging.getLogger(__name__)

class MockLLMProvider(BaseLLMProvider):
    """
    Mock LLM Provider for independent testing and fallback during development.
    """

    def __init__(self, model: str = "mock-hotel-assistant"):
        self._model = model

    @property
    def model_name(self) -> str:
        return self._model

    async def generate_response(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ) -> str:
        last_user_message = next((m.content for m in reversed(messages) if hasattr(m, "role") and m.role == "user" or isinstance(m, dict) and m.get("role") == "user"), "Hello")
        logger.info(f"[MockLLMProvider] Processing query: {last_user_message}")
        return f"Welcome to Royal Rudraksh Palace! (AI Assistant Mock Mode). You asked: '{last_user_message}'. How may I assist you with rooms or reservations today?"

    async def generate_response_stream(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ):
        full_res = await self.generate_response(messages, temperature, max_tokens, system_prompt)
        words = full_res.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini API Provider using official google-genai SDK.
    """

    def __init__(self, api_key: str, model: str = "gemini-3.6-flash"):
        self.api_key = api_key
        # Automatically use supported gemini-3.6-flash if legacy model name passed
        self._model = "gemini-3.6-flash" if "2.5" in model or "1.5" in model else model
        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
        except Exception as e:
            logger.error(f"Failed to initialize google-genai Client: {e}")
            self.client = None

    @property
    def model_name(self) -> str:
        return self._model

    async def generate_response(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ) -> str:
        if not self.api_key or not self.client:
            raise ValueError("GEMINI_API_KEY is not configured or Client failed to load.")

        prompt_parts = []
        if system_prompt:
            prompt_parts.append(f"System Instructions:\n{system_prompt}\n")

        for msg in messages:
            role_str = msg.role if hasattr(msg, "role") else msg.get("role")
            content_str = msg.content if hasattr(msg, "content") else msg.get("content")
            role_label = "User" if role_str == "user" else "Assistant"
            prompt_parts.append(f"{role_label}: {content_str}")

        full_prompt = "\n".join(prompt_parts)

        # Fallback active candidate models if 429 / 503 / 404 occurs on primary model
        models_to_try = [
            self._model,
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-3.6-flash"
        ]
        # Remove duplicates while maintaining order
        models_to_try = list(dict.fromkeys(models_to_try))

        last_error = None
        for m in models_to_try:
            try:
                logger.info(f"Generating content with Gemini model: '{m}'")
                response = self.client.models.generate_content(
                    model=m,
                    contents=full_prompt
                )
                if response and response.text:
                    return response.text
            except Exception as err:
                last_error = err
                logger.warning(f"Gemini API model '{m}' failed ({err}). Trying fallback model...")

        logger.error(f"All Gemini model attempts failed. Last error: {last_error}")

        # If system_prompt has RAG context or knowledge context, extract grounded facts as fallback
        if system_prompt and "Context:" in system_prompt:
            try:
                ctx_part = system_prompt.split("Context:")[1].split("Instructions:")[0].strip()
                if ctx_part:
                    return f"Here is the verified information from Royal Rudraksh Palace:\n\n{ctx_part}"
            except Exception:
                pass

        return "I am currently receiving high guest inquiry volume. Please contact our front desk directly or try again in a moment."

    async def generate_response_stream(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ):
        if not self.api_key or not self.client:
            yield "GEMINI_API_KEY is not configured."
            return

        prompt_parts = []
        if system_prompt:
            prompt_parts.append(f"System Instructions:\n{system_prompt}\n")

        for msg in messages:
            role_str = msg.role if hasattr(msg, "role") else msg.get("role")
            content_str = msg.content if hasattr(msg, "content") else msg.get("content")
            role_label = "User" if role_str == "user" else "Assistant"
            prompt_parts.append(f"{role_label}: {content_str}")

        full_prompt = "\n".join(prompt_parts)

        models_to_try = [self._model, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.6-flash"]
        models_to_try = list(dict.fromkeys(models_to_try))

        for m in models_to_try:
            try:
                logger.info(f"Generating streaming content with Gemini model: '{m}'")
                response_stream = self.client.models.generate_content_stream(
                    model=m,
                    contents=full_prompt
                )
                yielded = False
                for chunk in response_stream:
                    if chunk and chunk.text:
                        yielded = True
                        yield chunk.text
                if yielded:
                    return
            except Exception as err:
                logger.warning(f"Gemini API streaming model '{m}' failed ({err}). Trying fallback model...")

        full_res = await self.generate_response(messages, temperature, max_tokens, system_prompt)
        yield full_res




class OpenAILLMProvider(BaseLLMProvider):
    """
    OpenAI API Provider.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self._model = model

    @property
    def model_name(self) -> str:
        return self._model

    async def generate_response(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: str = ""
    ) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        payload = {
            "model": self._model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                logger.error(f"OpenAI API error ({response.status_code}): {response.text}")
                raise RuntimeError(f"OpenAI API error: {response.status_code}")

            data = response.json()
            return data["choices"][0]["message"]["content"]


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory method to return initialized LLM provider based on settings.
    """
    provider_type = settings.LLM_PROVIDER.lower()

    if provider_type == "gemini" and settings.GEMINI_API_KEY:
        logger.info(f"Using Gemini LLM Provider ({settings.LLM_MODEL})")
        return GeminiLLMProvider(api_key=settings.GEMINI_API_KEY, model=settings.LLM_MODEL)
    
    elif provider_type == "openai" and settings.OPENAI_API_KEY:
        logger.info(f"Using OpenAI LLM Provider ({settings.LLM_MODEL})")
        return OpenAILLMProvider(api_key=settings.OPENAI_API_KEY, model=settings.LLM_MODEL)

    else:
        if provider_type != "mock":
            logger.warning(f"Requested provider '{provider_type}' missing API key. Falling back to MockLLMProvider.")
        return MockLLMProvider()
