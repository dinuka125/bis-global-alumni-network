import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapView from './components/Map';
import AdminPanel from './components/Admin';
import { Map, Shield, GraduationCap } from 'lucide-react';
import itcLogo from './assets/itc-logo.png';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {/* Navigation Header */}
        <nav className="bg-bis-maroon text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src={itcLogo}
                  alt="Department of Information Technology Logo"
                  className="h-20 w-auto object-contain"
                />
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight">Department of Information Technology</span>
                    <span className="text-xs text-bis-gold font-medium">University of Sri Jayewardenepura</span>
                </div>
              </div>
              <div className="flex space-x-4">
                <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-white/10 transition">
                  <Map className="w-4 h-4 mr-2" />
                  Global Map
                </Link>
                <Link to="/admin" className="flex items-center px-3 py-2 rounded-md hover:bg-white/10 transition">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

