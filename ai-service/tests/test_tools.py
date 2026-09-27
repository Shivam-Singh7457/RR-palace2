import pytest
from app.tools.room_tools import GetRoomCatalogTool, CheckRoomAvailabilityTool
from app.tools.registry import tool_registry

@pytest.mark.asyncio
async def test_get_room_catalog_tool():
    tool = GetRoomCatalogTool()
    assert tool.name == "get_room_catalog"
    schema = tool.to_schema()
    assert schema["name"] == "get_room_catalog"

    res = await tool.execute()
    assert res["success"] is True
    assert "rooms" in res
    assert len(res["rooms"]) > 0


@pytest.mark.asyncio
async def test_check_room_availability_tool():
    tool = CheckRoomAvailabilityTool()
    assert tool.name == "check_room_availability"
    
    res = await tool.execute(check_in_date="2026-10-01", check_out_date="2026-10-05")
    assert "is_available" in res


@pytest.mark.asyncio
async def test_tool_registry():


    tool = tool_registry.get_tool("get_room_catalog")
    assert tool is not None

    schemas = tool_registry.get_schemas()
    assert len(schemas) >= 2

    res = await tool_registry.execute_tool("get_room_catalog", {})
    assert res["success"] is True
