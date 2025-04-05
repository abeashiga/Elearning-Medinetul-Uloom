import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../config";
import "./certificate.css";
import { toast } from "react-hot-toast";
import axios from "axios";

const Certificate = () => {
  const { courseId } = useParams();
  const { user } = UserData();
  const { course, fetchCourse } = CourseData();
  const [certificateData, setCertificateData] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState({
    isPassed: false,
    score: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse(courseId);
  }, [courseId]);

  useEffect(() => {
    const fetchAssessmentStatus = async () => {
      try {
        const { data } = await axios.get(
          `${server}/api/assessment/status/${courseId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'token': localStorage.getItem('token')
            }
          }
        );
        
        if (data.success) {
          setAssessmentStatus({
            isPassed: data.isPassed,
            score: data.score || 0
          });

          // Only set certificate data if assessment is passed
          if (data.isPassed && course && user) {
            setCertificateData({
              studentName: user.name,
              courseName: course.title,
              completionDate: new Date().toLocaleDateString(),
              certificateId: `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              score: `${data.score}%`,
            });
          }
        } else {
          toast.error(data.message || 'Failed to verify assessment status');
        }
      } catch (error) {
        console.error('Error fetching assessment status:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch assessment status');
        
        // If there's an authentication error, redirect to login
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    if (course && user) {
      fetchAssessmentStatus();
    }
  }, [course, user, courseId, navigate]);

  const downloadCertificate = () => {
    if (!assessmentStatus.isPassed) {
      toast.error("Please complete and pass the assessment to download your certificate.");
      return;
    }
    toast.success("Starting certificate download...");
  };

  if (!certificateData || !assessmentStatus.isPassed) {
    return (
      <div className="certificate-page py-5">
        <div className="container">
          <div className="certificate-wrapper bg-white shadow-lg rounded-3 p-4 mx-auto">
            <div className="alert alert-warning text-center mb-4" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {!certificateData 
                ? "First Take Assessment and Score Over Half !!" 
                : "Complete and pass the assessment to unlock your certificate"}
            </div>
            {!assessmentStatus.isPassed && (
              <div className="text-center mt-4">
                <button
                  onClick={() => navigate(`/course/study/${courseId}`)}
                  className="btn btn-primary"
                >
                  Return to Course
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-page py-5">
      <div className="container">
        <div className="certificate-wrapper bg-white shadow-lg rounded-3 p-4 mx-auto">
          <div className="certificate border border-2 border-golden p-5">
            <div className="certificate-header text-center mb-4">
              <div className="certificate-logo mb-3">
                <img
                  src="/src/assets/logo.jpg"
                  alt="Medinatul Uloom Logo"
                  className="img-fluid"
                  style={{ maxWidth: "200px" }}
                />
              </div>
              <h1 className="certificate-title mb-0">Certificate of Completion</h1>
              <div className="decorative-line"></div>
            </div>

            <div className="certificate-body text-center my-5">
              <p className="certificate-text fs-5 mb-2">
                This is to certify that
              </p>
              <h2 className="student-name display-4 fw-bold text-primary mb-2">
                {certificateData.studentName}
              </h2>
              <p className="certificate-text fs-5 mb-2">
                has successfully completed the course
              </p>
              <h3 className="course-name h2 fw-bold text-secondary mb-3">
                {certificateData.courseName}
              </h3>
              <p className="certificate-text fs-5 mb-2">
                with a score of{" "}
                <span className="fw-bold text-success">{certificateData.score}</span>
              </p>
              <p className="completion-date fst-italic">
                Completed on {certificateData.completionDate}
              </p>
            </div>

            <div className="certificate-footer mt-5">
              <div className="row align-items-end">
                <div className="col-12 text-center mb-4">
                  <div className="certificate-id small text-muted">
                    Certificate ID: {certificateData.certificateId}
                  </div>
                </div>
                <div className="col-12">
                  <div className="row signatures justify-content-around">
                    <div className="col-5 text-center">
                      <div className="signature">
                        <div className="signature-line border-bottom border-dark"></div>
                        <p className="mt-2 mb-0 fw-bold">Course Instructor</p>
                      </div>
                    </div>
                    <div className="col-5 text-center">
                      <div className="signature">
                        <div className="signature-line border-bottom border-dark">
                          Medinatul-Uloom
                        </div>
                        <p className="mt-2 mb-0 fw-bold">Program Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="certificate-actions text-center mt-4">
            <button
              onClick={downloadCertificate}
              className={`btn btn-lg px-5 py-3 rounded-pill shadow-sm ${
                assessmentStatus.isPassed ? 'btn-primary' : 'btn-secondary'
              }`}
              disabled={!assessmentStatus.isPassed}
            >
              <i className="fas fa-download me-2"></i>
              {assessmentStatus.isPassed ? 'Download Certificate' : 'Complete Assessment to Download'}
            </button>
            {!assessmentStatus.isPassed && (
              <p className="text-muted mt-2">
                <small>Pass the assessment to unlock your certificate</small>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate; 