import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { setuser } from "../store/AuthSlice";
import toast from "react-hot-toast";

function HeroSection() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);

  const handleLogout = () => {
    dispatch(setuser({}));
    toast.success("Logout successful");
  };

  return (
    <section className="w-full h-screen py-16 md:py-24 lg:py-32 xl:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_600px] items-center">
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                Industrial Data Monitoring
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Smart Anomaly
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Detection Platform
                </span>
              </h1>

              <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                Detect, analyze, and predict anomalies in industrial systems before they become critical problems.
                Monitor energy usage, CO₂ emissions, and power factor metrics with advanced algorithms.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={user.id ? "/dashboard" : "/auth"}>
                <button className="cursor-pointer group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="relative z-10">{user.id ? "Dashboard" : "Get Started"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
              {user.id && (
                <button onClick={handleLogout} aria-label="Logout" className="cursor-pointer group relative bg-white text-gray-800 text-lg font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="relative z-10">Logout</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-2">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80"
                  width="600"
                  height="400"
                  alt="Advanced Analytics Dashboard"
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
