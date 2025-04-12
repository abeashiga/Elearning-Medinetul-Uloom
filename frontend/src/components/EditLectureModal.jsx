import React, { useState } from 'react';
import axios from 'axios';
import { server } from '../config';
import toast from 'react-hot-toast';
import './EditLectureModal.css';

const EditLectureModal = ({ lecture, onClose, onUpdate }) => {
  const [title, setTitle] = useState(lecture.title);
  const [description, setDescription] = useState(lecture.description);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (file) {
        formData.append('file', file);
      }

      const { data } = await axios.put(
        `${server}/api/lecture/${lecture._id}`,
        formData,
        {
          headers: {
            token: localStorage.getItem('token'),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(data.message);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Error updating lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-lecture-modal">
      <div className="modal-content">
        <h2>Edit Lecture</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>New File (optional):</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="video/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
            />
          </div>

          <div className="button-group">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLectureModal;