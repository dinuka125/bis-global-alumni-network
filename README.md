# BIS Global Alumni Network

A full-stack application for the University of Sri Jayewardenepura, DIT.

## Tech Stack
- **Frontend:** React (Vite), TailwindCSS, React-Leaflet
- **Backend:** FastAPI (Python), Pandas (CSV Storage)

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The API will start at `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
The app will start at `http://localhost:5173`.

## Features
- **Interactive Map:** Uses `react-leaflet-cluster` to handle overlapping markers.
- **Admin Panel:** Located at `/admin` to add/remove alumni.
- **Auto-Geocoding:** Automatically converts "City, Country" to coordinates.
- **Theme:** Matches the University Maroon & Gold colors.

