"""Cost tracking service"""
from loguru import logger
from typing import Dict
import json
from pathlib import Path

class CostTracker:
    """Track AI API costs and usage"""
    
    def __init__(self):
        self.stats = {
            "total_requests": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "by_endpoint": {},
            "by_model": {}
        }
        self.stats_file = Path("logs/cost_stats.json")
    
    async def initialize(self):
        """Load saved stats"""
        if self.stats_file.exists():
            with open(self.stats_file) as f:
                self.stats = json.load(f)
            logger.info(f"Loaded cost stats: ${self.stats['total_cost']:.2f} total")
    
    async def track_request(
        self,
        endpoint: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cost: float,
        duration: float
    ):
        """Track a single request"""
        # Update totals
        self.stats["total_requests"] += 1
        self.stats["total_cost"] += cost
        self.stats["total_tokens"] += (input_tokens + output_tokens)
        
        # Track by endpoint
        if endpoint not in self.stats["by_endpoint"]:
            self.stats["by_endpoint"][endpoint] = {
                "requests": 0,
                "cost": 0.0,
                "tokens": 0
            }
        self.stats["by_endpoint"][endpoint]["requests"] += 1
        self.stats["by_endpoint"][endpoint]["cost"] += cost
        self.stats["by_endpoint"][endpoint]["tokens"] += (input_tokens + output_tokens)
        
        # Track by model
        if model not in self.stats["by_model"]:
            self.stats["by_model"][model] = {
                "requests": 0,
                "cost": 0.0,
                "tokens": 0
            }
        self.stats["by_model"][model]["requests"] += 1
        self.stats["by_model"][model]["cost"] += cost
        self.stats["by_model"][model]["tokens"] += (input_tokens + output_tokens)
    
    async def get_stats(self) -> Dict:
        """Get current stats"""
        avg_cost = (
            self.stats["total_cost"] / self.stats["total_requests"]
            if self.stats["total_requests"] > 0
            else 0.0
        )
        
        return {
            **self.stats,
            "average_cost_per_request": avg_cost
        }
    
    async def save_stats(self):
        """Save stats to file"""
        self.stats_file.parent.mkdir(exist_ok=True)
        with open(self.stats_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
        logger.info("Cost stats saved")

# Singleton
cost_tracker = CostTracker()

