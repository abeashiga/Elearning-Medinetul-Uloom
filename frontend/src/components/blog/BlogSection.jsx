import React, { useEffect, useState } from 'react';
import { server } from '../../config';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './blog.css';

const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/api/blog/recent`);
      
      if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
        // Only take the first 3 posts for a more compact display
        setPosts(response.data.posts.slice(0, 3));
      } else {
        console.error('Invalid response format:', response.data);
        setError('Failed to load blog posts');
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    e.target.onerror = null;
  };

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${server}/uploads/blog/${imageName}`;
  };

  if (loading) {
    return (
      <section className="blog-section">
        <h2>Latest Blog Posts</h2>
        <div className="loading">Loading blog posts...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="blog-section">
        <h2>Latest Blog Posts</h2>
        <div className="error">{error}</div>
      </section>
    );
  }

  return (
    <section className="blog-section">
      <h2>Latest Blog Posts</h2>
      {posts.length === 0 ? (
        <div className="no-posts">No blog posts available at the moment.</div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <div className="blog-card" key={post._id}>
              <div className="blog-image">
                <img 
                  src={getImageUrl(post.image)}
                  alt={post.title}
                  onError={handleImageError}
                  loading="lazy"
                  width="250"
                  height="150"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="blog-info">
                <h3>{post.title}</h3>
                <p className="date">{formatDate(post.createdAt)}</p>
                <p className="summary">{post.summary}</p>
                <Link to={`/blog/${post._id}`} className="read-more">
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BlogSection; 