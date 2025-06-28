import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Activity, LogOut, UserCircle, ChevronDown, TrendingUp } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import toast from 'react-hot-toast';
import { setuser } from '../store/AuthSlice';

interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Data Ingestion', path: '/dashboard' },
  { name: 'Multichannel View', path: '/multichannel' },
  { name: 'Model Training', path: '/model-training' },
  { name: 'Analytics', path: '/analytics', icon: <TrendingUp size={16} /> },
  { name: 'Alerts', path: '/alerts' },
  { name: 'FMEA', path: '/fmea' },
];

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  const handleLogout = () => {
    dispatch(setuser({}));
    toast.success('Logout successful');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const LogoutConfirmation = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            onClick={handleLogout}
          >
            Logout <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
                <Activity className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Smart Anomaly Detection</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={handleNavClick}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                >
                  <UserCircle className="h-5 w-5" />
                  <span className="truncate max-w-[150px]">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        Signed in as<br />
                        <span className="font-medium truncate block">{user.name}</span>
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={toggleMenu}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg transition-all duration-200 ease-out">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 text-base font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={handleNavClick}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
              <div className="px-4 py-2 space-y-2">
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <UserCircle className="h-5 w-5" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      {showLogoutConfirm && <LogoutConfirmation />}
    </>
  );
};

export default NavBar;
