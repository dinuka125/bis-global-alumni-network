from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
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

# --- Models ---
class StudentBase(BaseModel):
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
        df = pd.DataFrame(columns=["id", "name", "location", "job_title", "linkedin_url", "image_url", "latitude", "longitude"])
        df.to_csv(DATA_FILE, index=False)
        return df
    return pd.read_csv(DATA_FILE)

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
        if not row.get("name") or not row.get("location"):
            continue
            
        lat, lon = get_coordinates(row["location"])
        final_lat = lat if lat else 0.0
        final_lon = lon if lon else 0.0

        new_student = {
            "id": str(uuid.uuid4()),
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
        # Simple validation: check if 'name' and 'location' exist
        if 'name' not in df.columns or 'location' not in df.columns:
             raise HTTPException(status_code=400, detail="CSV must contain 'name' and 'location' columns.")

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
        
        if 'name' not in df.columns or 'location' not in df.columns:
             raise HTTPException(status_code=400, detail="Sheet must contain 'name' and 'location' columns.")

        count = process_and_add_students(df)
        return {"message": f"Successfully imported {count} students."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing sheet: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "BIS Alumni Network API"}

@app.get("/students")
def get_students():
    df = load_data()
    # Replace NaN with None for JSON serialization
    return df.where(pd.notnull(df), None).to_dict(orient="records")

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

