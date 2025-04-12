import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { TiTick } from "react-icons/ti";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileAudio, FaPlay, FaDownload, FaExpand, FaEdit, FaTrash } from "react-icons/fa";
import EditLectureModal from '../../components/EditLectureModal';

const Lecture = ({ user }) => {
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecLoading, setLecLoading] = useState(false);
  const [show, setShow] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [completedLec, setCompletedLec] = useState(0);
  const [lectLength, setLectLength] = useState(0);
  const [progress, setProgress] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [hasMarkedProgress, setHasMarkedProgress] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  useEffect(() => {
    // Validate course ID is available
    if (!params.id) {
      toast.error("Course ID is missing");
      navigate("/dashboard"); // or wherever you want to redirect
      return;
    }

    if (user && user.role !== "admin" && !user.subscription.includes(params.id)) {
      toast.error("You need to enroll in this course to access lectures");
      navigate("/");
      return;
    }
    fetchLectures();
  }, [user, params.id, navigate]);

  useEffect(() => {
    if (lectures.length > 0) {
      fetchProgress();
    }
  }, [lectures]);

  useEffect(() => {
    if (lecture?._id && !hasMarkedProgress) {
      addProgress(lecture._id);
      setHasMarkedProgress(true);
    }
  }, [lecture?._id]);

  useEffect(() => {
    if (lecture?.file && lecture.fileType === 'video') {
      const cleanPath = lecture.file
        .split('\\')
        .join('/')
        .replace(/^\/+/, '')
        .replace(/^uploads\//, '');
      const fileUrl = `${server}/uploads/${cleanPath}`;
      
      checkVideoUrl(fileUrl).then(isValid => {
        if (!isValid) {
          console.error('Video URL is not accessible:', fileUrl);
          toast.error('Video file is not accessible');
        }
      });
    }
  }, [lecture]);

  async function fetchLectures() {
    try {
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLectures(data.lectures);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  async function fetchLecture(id) {
    setLecLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/lecture/${id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLecture(data.lecture);
      setLecLoading(false);
    } catch (error) {
      console.log(error);
      setLecLoading(false);
    }
  }

  const changeFileHandler = (e) => {
    const file = e.target.files[0];
    
    // Check file size (e.g., 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 100MB");
      e.target.value = null; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(file);
    };
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    // Validate course ID
    if (!params.id) {
      toast.error("Course ID is missing");
      setBtnLoading(false);
      return;
    }

    // Validate form inputs
    if (!title.trim() || !description.trim() || !file) {
      toast.error("All fields are required");
      setBtnLoading(false);
      return;
    }

    const myForm = new FormData();
    myForm.append("title", title.trim());
    myForm.append("description", description.trim());
    myForm.append("file", file);

    try {
      // Log the request details for debugging
      console.log("Submitting lecture:", {
        courseId: params.id,
        title: title.trim(),
        description: description.trim(),
        fileSize: file.size,
        fileType: file.type
      });

      const { data } = await axios.post(
        `${server}/api/course/${params.id}`,
        myForm,
        {
          headers: {
            token: localStorage.getItem("token"),
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setShow(false);
        
        // Reset form
        setTitle("");
        setDescription("");
        setFile("");
        setFilePrev("");
        
        // Refresh lectures
        await fetchLectures();
        
        // Update progress if needed
        if (lectures.length > 0) {
          await fetchProgress();
        }
      } else {
        throw new Error(data.message || "Failed to add lecture");
      }
    } catch (error) {
      console.error("Error adding lecture:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to add lecture";
      toast.error(errorMessage);
      
      if (error.response?.status === 413) {
        toast.error("File is too large. Please try a smaller file.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      }
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm("Are you sure you want to delete this lecture?")) {
      try {
        const { data } = await axios.delete(`${server}/api/lecture/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });

        toast.success(data.message);
        fetchLectures();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Error deleting lecture");
      }
    }
  };

  async function fetchProgress() {
    try {
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${params.id}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      // Set total lectures length
      const totalLectures = lectures.length;
      setLectLength(totalLectures);

      // Handle case when no progress data exists
      if (data.message === "null" || !data.progress || !data.progress[0]) {
        setCompleted(0);
        setCompletedLec(0);
        setProgress([]);
        setProgressPercentage(0);
        document.documentElement.style.setProperty('--progress-percentage', 0);
        return;
      }

      // Get completed lectures count
      const completedLectures = data.progress[0]?.completedLectures?.length || 0;
      setCompletedLec(completedLectures);
      setProgress(data.progress);

      // Calculate percentage based on watched and unwatched lectures
      let percentage = 0;
      if (totalLectures > 0) {
        // Ensure percentage doesn't exceed 100%
        percentage = Math.min(Math.round((completedLectures / totalLectures) * 100), 100);
      }

      // Update progress states
      setCompleted(percentage);
      setProgressPercentage(percentage);
      document.documentElement.style.setProperty('--progress-percentage', percentage);

      console.log('Progress Update:', {
        completedLectures,
        totalLectures,
        percentage,
        progressData: data.progress[0]
      });

    } catch (error) {
      console.error('Error fetching progress:', error);
      // Reset all progress states on error
      setCompleted(0);
      setCompletedLec(0);
      setLectLength(lectures.length);
      setProgressPercentage(0);
      setProgress([]);
      document.documentElement.style.setProperty('--progress-percentage', 0);
    }
  }

  const addProgress = async (id) => {
    try {
      // Update backend progress
      const { data } = await axios.post(
        `${server}/api/user/progress?course=${params.id}&lectureId=${id}`,
        {},
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        // Fetch the latest progress
        await fetchProgress();
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error(error.response?.data?.message || "Failed to update progress");
    }
  };

  const renderFilePreview = () => {
    if (!lecture?.file) return null;

    // Helper function to get clean URL
    const getFileUrl = (filePath) => {
      const cleanPath = filePath
        .replace(/\\/g, '/') // Replace Windows backslashes
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/^uploads\//, ''); // Remove 'uploads/' if present
      
      return `${server}/uploads/${cleanPath}`;
    };

    switch (lecture.fileType) {
      case 'video':
        const videoUrl = getFileUrl(lecture.file);
        return (
          <div className="video-player">
            <div className="file-header">
              <FaPlay className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>Video Lecture</p>
              </div>
            </div>
            <div className="video-content">
              <video
                key={videoUrl}
                controls
                controlsList="nodownload"
                playsInline
                className="lecture-video"
                onError={(e) => {
                  console.error('Video loading error:', {
                    error: e,
                    src: videoUrl,
                    videoElement: e.target
                  });
                }}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        );
      case 'audio':
        const audioUrl = getFileUrl(lecture.file);
        return (
          <div className="audio-player">
            <div className="file-header">
              <FaFileAudio className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>Audio File</p>
              </div>
            </div>
            <div className="audio-content">
              <audio
                src={audioUrl}
                controls
                preload="metadata"
                onError={(e) => {
                  console.error("Audio loading error:", e);
                  toast.error("Error loading audio. Please try again.");
                }}
              />
            </div>
            <div className="audio-actions">
              <a href={audioUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(audioUrl, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
          </div>
        );
      case 'pdf':
        const pdfUrl = getFileUrl(lecture.file);
        return (
          <div className="pdf-viewer">
            <div className="file-header">
              <FaFilePdf className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>PDF Document</p>
              </div>
            </div>
            <div className="file-content">
              <embed
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                width="100%"
                height="100%"
              />
              <div className="loading-overlay">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
            <div className="file-actions">
              <a href={pdfUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(pdfUrl, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
          </div>
        );
      case 'ppt':
        const pptUrl = getFileUrl(lecture.file);
        return (
          <div className="ppt-viewer">
            <div className="file-header">
              <FaFilePowerpoint className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>PowerPoint Presentation</p>
              </div>
            </div>
            <div className="file-content">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${pptUrl}&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=False&wdToolbar=False&wdHeader=False&wdMenubar=False`}
                title="PowerPoint Viewer"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
              <div className="loading-overlay">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
            <div className="file-actions">
              <a href={pptUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${pptUrl}`, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
          </div>
        );
      case 'doc':
        const docUrl = getFileUrl(lecture.file);
        return (
          <div className="doc-viewer">
            <div className="file-header">
              <FaFileWord className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>Word Document</p>
              </div>
            </div>
            <div className="file-content">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${docUrl}&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=False&wdToolbar=False&wdHeader=False&wdMenubar=False`}
                title="Word Viewer"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
              <div className="loading-overlay">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
            <div className="file-actions">
              <a href={docUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${docUrl}`, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleEditClick = (lecture) => {
    setEditingLecture(lecture);
  };

  const handleEditClose = () => {
    setEditingLecture(null);
  };

  const handleEditUpdate = () => {
    fetchLectures();
    setEditingLecture(null);
  };

  const checkVideoUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log('Video URL check:', {
        url,
        status: response.status,
        contentType: response.headers.get('content-type')
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking video URL:', error);
      return false;
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className={`progress-circle ${progressPercentage > 0 ? 'updating' : ''}`}>
            <div className="progress-value">{progressPercentage}%</div>
          </div>
          <div className="lecture-page">
            <div className="left">
              {lecLoading ? (
                <Loading />
              ) : (
                <>
                  {lecture ? (
                    <>
                      {renderFilePreview()}
                      <h1>{lecture.title}</h1>
                      <h3>{lecture.description}</h3>
                    </>
                  ) : (
                    <div className="no-lecture-message">
                      <h1>Welcome to the Course</h1>
                      <p>Please select a lecture from the list on the right to begin learning.</p>
                      {lectures.length === 0 && (
                        <div className="no-content-message">
                          <i className="fas fa-book"></i>
                          <h2>No Lectures Available Yet</h2>
                          <p>This course is currently being prepared. Please check back later for content.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="right">
              {user && user.role === "admin" && (
                <button className="common-btn" onClick={() => setShow(!show)}>
                  {show ? "Close" : "Add Lecture +"}
                </button>
              )}

              {show && (
                <div className="lecture-form">
                  <h2>Add Lecture</h2>
                  <form onSubmit={submitHandler}>
                    <label htmlFor="text">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />

                    <label htmlFor="text">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />

                    <input
                      type="file"
                      placeholder="Choose file"
                      onChange={changeFileHandler}
                      accept="video/*,audio/*,.pdf,.ppt,.ppt,.doc,.docx"
                      required
                    />

                    {filePrev && (
                      <div className="file-preview">
                        {file.type.startsWith('video/') ? (
                          <video src={filePrev} controls width={300} />
                        ) : file.type.startsWith('audio/') ? (
                          <audio src={filePrev} controls />
                        ) : file.type === 'application/pdf' ? (
                          <iframe src={filePrev} width={300} height={200} />
                        ) : null}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="common-btn"
                      disabled={btnLoading}
                    >
                      {btnLoading ? "Adding..." : "Add Lecture"}
                    </button>
                  </form>
                </div>
              )}

              <div className="lecture-list">
                {lectures.length === 0 ? (
                  <div className="no-lectures-message">
                    <i className="fas fa-book"></i>
                    <h3>No Lectures Available</h3>
                    <p>This course is currently being prepared. Please check back later for content.</p>
                  </div>
                ) : (
                  lectures.map((item) => (
                    <div
                      key={item._id}
                      className={`lecture-item ${
                        currentLecture?._id === item._id ? "active" : ""
                      } ${progress[0]?.completedLectures.includes(item._id) ? "completed" : ""}`}
                      onClick={async () => {
                        setCurrentLecture(item);
                        setHasMarkedProgress(false);
                        await fetchLecture(item._id);
                      }}
                    >
                      <div className="lecture-info">
                        <span className="lecture-title">{item.title}</span>
                        <span className="lecture-duration">{item.duration}</span>
                      </div>
                      {progress[0]?.completedLectures.includes(item._id) && (
                        <span className="completion-icon">✓</span>
                      )}
                      {user && user.role === "admin" && (
                        <div className="lecture-actions">
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(item);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHandler(item._id);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {editingLecture && (
            <EditLectureModal
              lecture={editingLecture}
              onClose={handleEditClose}
              onUpdate={handleEditUpdate}
            />
          )}
        </>
      )}
    </>
  );
};

export default Lecture;
