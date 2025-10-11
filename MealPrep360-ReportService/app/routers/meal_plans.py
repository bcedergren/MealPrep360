"""Meal plan PDF generation"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger
import io

from app.services.pdf_generator import pdf_generator
from app.core.database import db_manager

router = APIRouter()

@router.get("/{meal_plan_id}/pdf")
async def generate_meal_plan_pdf(meal_plan_id: str):
    """Generate PDF for a meal plan"""
    try:
        # Get meal plan from database
        meal_plans_collection = db_manager.get_collection("mealplans")
        meal_plan = await meal_plans_collection.find_one({"_id": meal_plan_id})
        
        if not meal_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        # Generate PDF
        pdf_bytes = pdf_generator.generate_meal_plan_pdf(meal_plan)
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=meal_plan_{meal_plan_id}.pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

