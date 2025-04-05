import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import { FaClock, FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";

const TakeAssessment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lectureProgress, setLectureProgress] = useState({
    completed: 0,
    total: 0,
    isCompleted: false
  });

  useEffect(() => {
    checkLectureProgress();
    fetchAssessment();
  }, [courseId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const checkLectureProgress = async () => {
    try {
      // Get total lectures count first
      const lecturesResponse = await axios.get(
        `${server}/api/lectures/${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const totalLectures = lecturesResponse.data.lectures.length;

      // Get user progress
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      // Get completed lectures count, ensuring it doesn't exceed total lectures
      const completedLectures = Math.min(
        data.progress?.[0]?.completedLectures?.length || 0,
        totalLectures
      );

      setLectureProgress({
        completed: completedLectures,
        total: totalLectures,
        isCompleted: completedLectures === totalLectures && totalLectures > 0
      });
    } catch (error) {
      console.error("Error checking lecture progress:", error);
      toast.error("Failed to check lecture progress");
    }
  };

  const fetchAssessment = async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/assessment/course/${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        setAssessment(data.assessment);
        setAnswers(new Array(data.assessment.questions.length).fill(null));
        setTimeLeft(data.assessment.timeLimit * 60);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch assessment");
      navigate(`/course/${courseId}`);
    }
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitAssessment = async () => {
    if (submitting) return;

    // Check if all questions are answered
    if (answers.some((answer) => answer === null)) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${server}/api/assessment/course/${courseId}/submit`,
        { answers },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        toast.success(
          `Assessment submitted! Score: ${data.score}% (${
            data.passed ? "Passed" : "Failed"
          })`
        );
        // Always redirect to study page after submission
        setTimeout(() => {
          navigate(`/course/study/${courseId}`);
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-warning">No assessment found</div>
      </div>
    );
  }

  if (!lectureProgress.isCompleted) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <FaLock className="display-1 text-warning mb-3" />
            <h2 className="card-title mb-3">Assessment Locked</h2>
            <p className="card-text mb-4">
              Complete all lectures to unlock the assessment.
              <br />
              Progress: {lectureProgress.completed} of {lectureProgress.total} lectures completed
            </p>
            <div className="progress mb-4" style={{ height: "20px" }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${(lectureProgress.completed / lectureProgress.total) * 100}%` }}
                aria-valuenow={lectureProgress.completed}
                aria-valuemin="0"
                aria-valuemax={lectureProgress.total}
              >
                {Math.round((lectureProgress.completed / lectureProgress.total) * 100)}%
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/course/study/${courseId}`)}
            >
              Return to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="take-assessment">
      <div className="assessment-header">
        <h2 className="mb-3">{assessment.title}</h2>
        <p className="lead mb-4">{assessment.description}</p>
        <div className="time-remaining">
          <FaClock className="me-2" />
          Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      <div className="questions">
        {assessment.questions.map((question, qIndex) => (
          <div key={qIndex} className="question">
            <h3 className="mb-4">
              Question {qIndex + 1} of {assessment.questions.length}
            </h3>
            <p className="lead mb-4">{question.question}</p>
            <div className="options">
              {question.options.map((option, oIndex) => (
                <div
                  key={oIndex}
                  className={`option ${
                    answers[qIndex] === oIndex ? "selected" : ""
                  }`}
                  onClick={() => handleAnswer(qIndex, oIndex)}
                >
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name={`question-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => handleAnswer(qIndex, oIndex)}
                    />
                    <label className="form-check-label">{option}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="assessment-footer">
        <button
          className="btn btn-primary btn-lg submit-btn"
          onClick={submitAssessment}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Submitting...
            </>
          ) : (
            "Submit Assessment"
          )}
        </button>
      </div>
    </div>
  );
};

export default TakeAssessment; 