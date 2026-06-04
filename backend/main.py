from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import os
import uuid
import io
import requests
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

app = FastAPI()

# CORS Configuration - Production ready
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if ALLOWED_ORIGINS == ["*"]:
    # Development mode - allow all
    origins = ["*"]
else:
    # Production mode - specific origins
    origins = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "students.csv"

# Headers for fetching external profile photos (LinkedIn CDN blocks browser hotlinking)
AVATAR_FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}

# --- Models ---
class StudentBase(BaseModel):
    batch: str
    name: str
    location: str
    job_title: str
    linkedin_url: str
    image_url: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str
    latitude: float
    longitude: float

# --- Helpers ---
def load_data():
    if not os.path.exists(DATA_FILE):
        df = pd.DataFrame(columns=["id", "batch", "name", "location", "job_title", "linkedin_url", "image_url", "latitude", "longitude"])
        df.to_csv(DATA_FILE, index=False)
        return df
    df = pd.read_csv(DATA_FILE)
    # Ensure batch column exists (for backward compatibility with old data)
    if "batch" not in df.columns:
        df["batch"] = ""
    # Fill empty strings in batch with empty string (not NaN)
    df["batch"] = df["batch"].fillna("")
    return df

def save_data(df):
    df.to_csv(DATA_FILE, index=False)

def get_coordinates(location_name):
    if not location_name:
        return None, None
    geolocator = Nominatim(user_agent="bis_alumni_map")
    try:
        location = geolocator.geocode(location_name, timeout=5)
        if location:
            return location.latitude, location.longitude
        return None, None
    except:
        return None, None

def process_and_add_students(new_students_df):
    current_df = load_data()
    added_students = []

    for index, row in new_students_df.iterrows():
        # Validate required fields
        if not row.get("batch") or not row.get("name") or not row.get("location"):
            continue
            
        lat, lon = get_coordinates(row["location"])
        final_lat = lat if lat else 0.0
        final_lon = lon if lon else 0.0

        new_student = {
            "id": str(uuid.uuid4()),
            "batch": row.get("batch", ""),
            "name": row.get("name", ""),
            "location": row.get("location", ""),
            "job_title": row.get("job_title", ""),
            "linkedin_url": row.get("linkedin_url", ""),
            "image_url": row.get("image_url", ""),
            "latitude": final_lat,
            "longitude": final_lon
        }
        added_students.append(new_student)
    
    if added_students:
        current_df = pd.concat([current_df, pd.DataFrame(added_students)], ignore_index=True)
        save_data(current_df)
    
    return len(added_students)

# --- Routes ---

@app.post("/students/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Normalize column names
        df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
        
        # Ensure required columns exist (map common variations if needed)
        # Simple validation: check if 'batch', 'name' and 'location' exist
        if 'batch' not in df.columns or 'name' not in df.columns or 'location' not in df.columns:
             raise HTTPException(status_code=400, detail="CSV must contain 'batch', 'name' and 'location' columns.")

        count = process_and_add_students(df)
        return {"message": f"Successfully imported {count} students."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

class GoogleSheetRequest(BaseModel):
    url: str

@app.post("/students/import_google_sheet")
async def import_google_sheet(request: GoogleSheetRequest):
    url = request.url
    # Convert standard Google Sheet URL to CSV export URL
    # Format: https://docs.google.com/spreadsheets/d/{sheet_id}/edit...
    # Target: https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv
    
    if "docs.google.com/spreadsheets" not in url:
        raise HTTPException(status_code=400, detail="Invalid Google Sheet URL")
    
    try:
        # Simple extraction of Sheet ID
        # Split by /d/ and then take the next part until /
        sheet_id = url.split("/d/")[1].split("/")[0]
        csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
        
        response = requests.get(csv_url)
        if response.status_code != 200:
             raise HTTPException(status_code=400, detail="Could not download CSV. Make sure the sheet is public (Anyone with link can view).")
             
        df = pd.read_csv(io.StringIO(response.content.decode('utf-8')))
        
        # Normalize headers
        df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
        
        if 'batch' not in df.columns or 'name' not in df.columns or 'location' not in df.columns:
             raise HTTPException(status_code=400, detail="Sheet must contain 'batch', 'name' and 'location' columns.")

        count = process_and_add_students(df)
        return {"message": f"Successfully imported {count} students."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing sheet: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "BIS Alumni Network API"}

def _get_student_image_url(student_id: str) -> str:
    df = load_data()
    match = df[df["id"] == student_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Student not found")
    image_url = match.iloc[0].get("image_url")
    if pd.isna(image_url):
        raise HTTPException(status_code=404, detail="No profile image")
    image_url = str(image_url).strip()
    if not image_url:
        raise HTTPException(status_code=404, detail="No profile image")
    return image_url


@app.get("/students/{student_id}/avatar")
def get_student_avatar(student_id: str):
    """Proxy profile images so map markers can load LinkedIn CDN URLs (blocked in-browser)."""
    image_url = _get_student_image_url(student_id)
    referer = "https://www.linkedin.com/"
    if "researchgate.net" in image_url or "rgstatic.net" in image_url:
        referer = "https://www.researchgate.net/"

    try:
        response = requests.get(
            image_url,
            headers={**AVATAR_FETCH_HEADERS, "Referer": referer},
            timeout=12,
        )
    except requests.RequestException:
        raise HTTPException(status_code=404, detail="Could not fetch profile image")

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Could not fetch profile image")

    content_type = response.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=404, detail="Invalid profile image")

    return Response(
        content=response.content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/students")
def get_students():
    df = load_data()
    # Replace NaN with None for JSON serialization
    # Handle NaN values properly for JSON compatibility
    import math
    
    # Fill NaN in string columns with empty string
    # For float columns, replace NaN with None directly
    for col in df.columns:
        if df[col].dtype == 'float64':
            df[col] = df[col].replace([np.nan, np.inf, -np.inf], None)
        else:
            df[col] = df[col].fillna("")
    
    records = df.to_dict(orient="records")
    # Final cleanup: replace empty strings with None, and handle any remaining float NaN
    for record in records:
        for key, value in record.items():
            if value == "":
                record[key] = None
            elif isinstance(value, float):
                if math.isnan(value) or math.isinf(value):
                    record[key] = None
    return records

@app.post("/students")
def create_student(student: StudentCreate):
    df = load_data()
    
    # Geocode
    lat, lon = get_coordinates(student.location)
    
    # If automatic geocoding fails, we default to 0,0 (user can edit later)
    # Ideally we should ask frontend to handle this, but for now simple logic
    final_lat = lat if lat else 0.0
    final_lon = lon if lon else 0.0

    new_student = {
        "id": str(uuid.uuid4()),
        "batch": student.batch,
        "name": student.name,
        "location": student.location,
        "job_title": student.job_title,
        "linkedin_url": student.linkedin_url,
        "image_url": student.image_url,
        "latitude": final_lat,
        "longitude": final_lon
    }
    
    df = pd.concat([df, pd.DataFrame([new_student])], ignore_index=True)
    save_data(df)
    return new_student

@app.delete("/students/{student_id}")
def delete_student(student_id: str):
    df = load_data()
    df = df[df["id"] != student_id]
    save_data(df)
    return {"message": "Deleted successfully"}

class BulkDeleteRequest(BaseModel):
    student_ids: list[str]

@app.delete("/students/bulk")
def bulk_delete_students(request: BulkDeleteRequest):
    df = load_data()
    initial_count = len(df)
    # Remove all students with IDs in the request
    df = df[~df["id"].isin(request.student_ids)]
    deleted_count = initial_count - len(df)
    save_data(df)
    return {"message": f"Successfully deleted {deleted_count} student(s)", "deleted_count": deleted_count}

@app.put("/students/{student_id}")
def update_student(student_id: str, student: StudentCreate):
    df = load_data()
    
    # Check if student exists
    if student_id not in df["id"].values:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Geocode again if location changed (optimization: check if location is different)
    # For simplicity, we just re-geocode every time or we could trust client.
    # Let's re-geocode.
    lat, lon = get_coordinates(student.location)
    final_lat = lat if lat else 0.0
    final_lon = lon if lon else 0.0

    # Update row
    # We find the index of the row
    idx = df.index[df["id"] == student_id].tolist()[0]
    
    df.at[idx, "batch"] = student.batch
    df.at[idx, "name"] = student.name
    df.at[idx, "location"] = student.location
    df.at[idx, "job_title"] = student.job_title
    df.at[idx, "linkedin_url"] = student.linkedin_url
    df.at[idx, "image_url"] = student.image_url
    df.at[idx, "latitude"] = final_lat
    df.at[idx, "longitude"] = final_lon
    
    save_data(df)
    return {"message": "Updated successfully", "student": df.iloc[idx].to_dict()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

