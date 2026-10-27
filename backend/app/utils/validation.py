"""
Pydantic Request & Response Validation Schemas.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class RiskPredictionRequest(BaseModel):
    area_name: str = Field(..., description="LAPD Geographic Area name (e.g. 'Central', 'Hollywood')")
    month: int = Field(..., ge=1, le=12, description="Month of year (1 - 12)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0 = Monday, 6 = Sunday)")
    time_period_code: int = Field(..., ge=0, le=3, description="Time period (0 = Night, 1 = Morning, 2 = Afternoon, 3 = Evening)")

class FilterParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    area: Optional[str] = None
    category: Optional[str] = None

class PipelineRunRequest(BaseModel):
    force_reprocess: bool = False
    n_clusters: Optional[int] = 12
