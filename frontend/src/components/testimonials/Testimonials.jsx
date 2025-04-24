import React, { useEffect, useState } from "react";
import "./testimonials.css";
import { server } from "../../config";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState("");
  const { user } = UserData();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${server}/api/testimonials`);
      // Sort by date and take only the latest 5
      const sortedTestimonials = response.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setTestimonials(sortedTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please register first to share your experience");
      navigate('/register');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${server}/api/testimonials`,
        { message: newTestimonial },
        {
          headers: {
            token: token,
            "Content-Type": "application/json"
          }
        }
      );
      toast.success("Testimonial submitted successfully!");
      setNewTestimonial("");
      // Add the new testimonial to the beginning of the list
      setTestimonials(prev => [response.data, ...prev].slice(0, 5));
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please register first to share your experience");
        navigate('/register');
      } else {
        toast.error(error.response?.data?.message || "Failed to submit testimonial");
      }
    }
  };

  const getImageUrl = (profileImage) => {
    if (!profileImage) return null;
    return `${server}/uploads/profiles/${profileImage}`;
  };

  return (
    <section className="testimonials">
      <h2>What our students say</h2>
      
      {user && (
        <form onSubmit={handleSubmit} className="testimonial-form">
          <textarea
            value={newTestimonial}
            onChange={(e) => setNewTestimonial(e.target.value)}
            placeholder="Share your experience..."
            required
            className="testimonial-input"
          />
          <button type="submit" className="submit-testimonial">
            Submit Testimonial
          </button>
        </form>
      )}

      <div className="testmonials-cards">
        {testimonials.map((testimonial) => (
          <div className="testimonial-card" key={testimonial._id}>
            <div className="student-image">
              {testimonial.user?.profileImage ? (
                <img 
                  src={getImageUrl(testimonial.user.profileImage)}
                  alt={testimonial.user?.name || "Student"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <FaUserCircle className="default-icon" />
              )}
            </div>
            <p className="message">{testimonial.message}</p>
            <div className="info">
              <p className="name">{testimonial.user?.name || "Anonymous"}</p>
              <p className="position">Student</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
