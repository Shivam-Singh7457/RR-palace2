from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseTool(ABC):
    """
    Abstract base class for all AI tools.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the tool."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the tool does."""
        pass

    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """JSON Schema dictionary describing the expected arguments."""
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Executes the tool with keyword arguments and returns a dictionary payload."""
        pass

    def to_schema(self) -> Dict[str, Any]:
        """Returns JSON schema representation of the tool."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }
