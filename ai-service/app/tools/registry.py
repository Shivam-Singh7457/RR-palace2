import logging
from typing import Dict, List, Any, Optional
from app.tools.base import BaseTool
from app.tools.room_tools import GetRoomCatalogTool, CheckRoomAvailabilityTool, CancelBookingTool, CreateBookingTool

logger = logging.getLogger(__name__)

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        self.register(GetRoomCatalogTool())
        self.register(CheckRoomAvailabilityTool())
        self.register(CancelBookingTool())
        self.register(CreateBookingTool())



    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def get_schemas(self) -> List[Dict[str, Any]]:
        return [tool.to_schema() for tool in self._tools.values()]

    async def execute_tool(self, name: str, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        tool = self.get_tool(name)
        if not tool:
            logger.error(f"Tool '{name}' not found in registry.")
            return {"success": False, "error": f"Tool '{name}' is not registered."}
        
        try:
            logger.info(f"Executing tool '{name}' with args: {kwargs}")
            return await tool.execute(**kwargs)
        except Exception as e:
            logger.error(f"Error executing tool '{name}': {e}", exc_info=True)
            return {"success": False, "error": str(e)}

tool_registry = ToolRegistry()
