"""PDF generation service"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from loguru import logger

class PDFGenerator:
    """Generate professional PDFs"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2C5F2D'),
            spaceAfter=30
        )
    
    def generate_meal_plan_pdf(self, meal_plan: dict) -> bytes:
        """Generate PDF for a meal plan"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        title = Paragraph(f"Meal Plan: {meal_plan.get('name', 'My Meal Plan')}", self.title_style)
        story.append(title)
        story.append(Spacer(1, 0.2*inch))
        
        # Date range
        date_text = f"Week of {meal_plan.get('start_date', '')} to {meal_plan.get('end_date', '')}"
        story.append(Paragraph(date_text, self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Meals table
        days = meal_plan.get('items', [])
        
        if days:
            data = [['Day', 'Breakfast', 'Lunch', 'Dinner']]
            
            # Group by day
            import pandas as pd
            df = pd.DataFrame(days)
            
            for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
                day_meals = df[df.get('day', '') == day] if not df.empty else []
                breakfast = lunch = dinner = ''
                
                for _, meal in day_meals.iterrows() if not df.empty else []:
                    meal_type = meal.get('mealType', '').lower()
                    recipe_name = meal.get('recipe', {}).get('title', 'TBD')
                    
                    if 'breakfast' in meal_type:
                        breakfast = recipe_name
                    elif 'lunch' in meal_type:
                        lunch = recipe_name
                    elif 'dinner' in meal_type:
                        dinner = recipe_name
                
                data.append([day, breakfast, lunch, dinner])
            
            table = Table(data, colWidths=[1.5*inch, 2*inch, 2*inch, 2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C5F2D')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
        
        # Build PDF
        doc.build(story)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        logger.info(f"Generated meal plan PDF ({len(pdf_bytes)} bytes)")
        
        return pdf_bytes
    
    def generate_shopping_list_pdf(self, shopping_list: dict) -> bytes:
        """Generate PDF for shopping list"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        title = Paragraph("Shopping List", self.title_style)
        story.append(title)
        story.append(Spacer(1, 0.3*inch))
        
        # Items grouped by category
        items = shopping_list.get('items', [])
        
        if items:
            # Group by aisle/category
            import pandas as pd
            df = pd.DataFrame(items)
            
            if 'category' in df.columns:
                grouped = df.groupby('category')
            else:
                grouped = [('Items', df)]
            
            for category, group in grouped:
                # Category header
                story.append(Paragraph(f"<b>{category}</b>", self.styles['Heading2']))
                story.append(Spacer(1, 0.1*inch))
                
                # Items
                for _, item in group.iterrows():
                    item_text = f"☐ {item.get('name', 'Unknown')} - {item.get('amount', '')} {item.get('unit', '')}"
                    story.append(Paragraph(item_text, self.styles['Normal']))
                
                story.append(Spacer(1, 0.2*inch))
        
        doc.build(story)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes

# Singleton
pdf_generator = PDFGenerator()

