import React, { useState, useEffect } from "react";
import Layout from "../Utils/Layout";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";
import { FaBook, FaPlus, FaBookOpen } from "react-icons/fa";

const AdminCourses = ({ user }) => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (user && user.role !== "admin") return navigate("/");

  const { courses } = CourseData();

  return (
    <Layout>
      {/* Container with further decreased height */}
      <div className="admin-courses-container bg-white" style={{
        position: 'absolute',
        right: '20px',
        width: '75%',
        padding: '0 2rem',
        height: '70vh', // Reduced from 85vh to 70vh
        overflowY: 'auto',
        marginTop: '10px', // Reduced margin
        marginBottom: '10px', // Reduced margin
        borderLeft: ' #e0e0e0'
      }}>
        {/* Compact Page Header */}
        <div className="page-header py-2 mb-2 bg-#e0e0e0 fw-bold bg-gradient"> {/* Further reduced padding */}
          <div className="container-fluid px-3"> {/* Reduced padding */}
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="text-black mb-0 fw-bold" style={{ fontSize: '1.3rem' }}>Course Management</h1> {/* Smaller font */}
                <p className="text-black-50 mb-0" style={{ fontSize: '0.8rem' }}> {/* Smaller font */}
                  <small>Manage all courses in the system</small>
                </p>
              </div>
              <button 
                className="btn btn-light btn-sm shadow-sm px-2" // More compact button
                onClick={() => navigate("/admin/course/add")}
              >
                <FaPlus className="me-1" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with tighter spacing */}
        <div className="container-fluid px-3" style={{ height: 'calc(100% - 80px)' }}> {/* Adjusted height */}
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-1"> {/* Minimal padding */}
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h6 mb-0 text-primary fw-bold" style={{ fontSize: '0.95rem' }}> {/* Smaller font */}
                  <FaBook className="me-1" size={14} /> All Courses {/* Smaller icon */}
                </h2>
                <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.75rem' }}>
                  {courses?.length || 0} courses
                </span>
              </div>
            </div>
            <div className="card-body p-2" style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}> {/* Tighter padding */}
              {courses && courses.length > 0 ? (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-1"> {/* Fewer columns, tighter gutter */}
                  {courses.map((course) => (
                    <div className="col" key={course._id}>
                      <CourseCard course={course} compact={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2" style={{ height: '100%' }}>
                  <div className="empty-state bg-white p-2 rounded-3 shadow-sm mx-auto" style={{ maxWidth: '350px' }}>
                    <FaBookOpen className="text-muted mb-1" style={{ fontSize: '1.5rem' }} /> {/* Smaller icon */}
                    <h4 className="text-muted fw-normal" style={{ fontSize: '1rem' }}>No Courses</h4> {/* Smaller text */}
                    <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                      Add your first course
                    </p>
                    <button 
                      className="btn btn-primary px-2 btn-sm"
                      onClick={() => navigate("/admin/course/add")}
                    >
                      <FaPlus className="me-1" /> Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact screen size display */}
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '3px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          zIndex: 1000
        }}>
          {windowSize.width} x {windowSize.height} px
        </div>

        {/* Custom CSS */}
        <style jsx>{`
          .page-header {
            background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%);
            border-radius: 0;
          }
          .card {
            border-radius: 0.4rem;
            transition: all 0.2s ease;
          }
          .card:hover {
            box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.08) !important;
          }
          .admin-courses-container {
            background-color:rgb(240, 234, 244);
          }
          @media (max-width: 768px) {
            .admin-courses-container {
              width: 100% !important;
              padding: 0 0.8rem !important;
              right: 0 !important;
              position: relative;
              height: auto !important;
              margin: 8px 0 !important;
              border-left: none !important;
            }
            .page-header {
              border-radius: 0 !important;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default AdminCourses;