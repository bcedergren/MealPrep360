"""Data export endpoints"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO, StringIO
from loguru import logger

from app.core.database import db_manager

router = APIRouter()

@router.get("/recipes/csv")
async def export_recipes_csv(limit: int = Query(1000, ge=1, le=10000)):
    """Export recipes to CSV"""
    try:
        recipes_collection = db_manager.get_collection("recipes")
        recipes_list = await recipes_collection.find({}).limit(limit).to_list(length=limit)
        
        df = pd.DataFrame(recipes_list)
        
        # Select relevant columns
        columns = [
            'title', 'description', 'category', 'cuisine', 'difficulty',
            'prepTime', 'cookTime', 'servings', 'season', 'isPublic'
        ]
        df = df[[col for col in columns if col in df.columns]]
        
        # Convert to CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=recipes_{pd.Timestamp.now().strftime('%Y%m%d')}.csv"}
        )
        
    except Exception as e:
        logger.error(f"CSV export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/excel")
async def export_recipes_excel(limit: int = Query(1000, ge=1, le=10000)):
    """Export recipes to Excel"""
    try:
        recipes_collection = db_manager.get_collection("recipes")
        recipes_list = await recipes_collection.find({}).limit(limit).to_list(length=limit)
        
        df = pd.DataFrame(recipes_list)
        
        # Select and organize columns
        columns = [
            'title', 'description', 'category', 'cuisine', 'difficulty',
            'prepTime', 'cookTime', 'servings', 'season', 'tags', 'isPublic'
        ]
        df = df[[col for col in columns if col in df.columns]]
        
        # Convert to Excel with formatting
        excel_buffer = BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Recipes', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Recipes']
            for idx, col in enumerate(df.columns):
                max_length = max(
                    df[col].astype(str).apply(len).max(),
                    len(col)
                )
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 50)
        
        excel_buffer.seek(0)
        
        return StreamingResponse(
            iter([excel_buffer.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=recipes_{pd.Timestamp.now().strftime('%Y%m%d')}.xlsx"}
        )
        
    except Exception as e:
        logger.error(f"Excel export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/csv")
async def export_users_csv(limit: int = Query(1000, ge=1, le=10000)):
    """Export users to CSV"""
    try:
        users_collection = db_manager.get_collection("users")
        users_list = await users_collection.find({}).limit(limit).to_list(length=limit)
        
        df = pd.DataFrame(users_list)
        
        # Select relevant columns (exclude sensitive data)
        columns = ['email', 'name', 'createdAt', 'lastActive']
        df = df[[col for col in columns if col in df.columns]]
        
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=users_{pd.Timestamp.now().strftime('%Y%m%d')}.csv"}
        )
        
    except Exception as e:
        logger.error(f"User CSV export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

