"""Shopping list PDF generation"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger
import io

from app.services.pdf_generator import pdf_generator
from app.core.database import db_manager

router = APIRouter()

@router.get("/{list_id}/pdf")
async def generate_shopping_list_pdf(list_id: str):
    """Generate PDF for a shopping list"""
    try:
        lists_collection = db_manager.get_collection("shoppinglists")
        shopping_list = await lists_collection.find_one({"_id": list_id})
        
        if not shopping_list:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        
        pdf_bytes = pdf_generator.generate_shopping_list_pdf(shopping_list)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=shopping_list_{list_id}.pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Shopping list PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

