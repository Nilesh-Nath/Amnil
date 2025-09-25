// Profile.jsx
import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [expenses, setExpenses] = useState([]);
  const [data, setData] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { fetchUserData(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchExpenses(1); /* eslint-disable-next-line */ }, []);

  const fetchUserData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/profile', {
        withCredentials: true,
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to fetch user data');
    }
  };

  const fetchExpenses = async (page = 1, limit = 2) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/expenses/all?page=${page}&limit=${limit}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setExpenses(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchExpenses(newPage, pagination.itemsPerPage);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      toast.info(response.data.msg);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Logout failed');
    }
  };

  // File input change -> show preview and upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview local file
    const localUrl = URL.createObjectURL(file);
    setPreviewSrc(localUrl);

    // prepare upload
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      setUploading(true);
      const res = await axios.post('http://localhost:5000/api/upload/profile-pic', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      toast.success(res.data.msg || 'Uploaded');
      // update local data.profile_pic_url with returned url
      setData(prev => ({ ...prev, profile_pic_url: res.data.profilePic }));
      // remove local preview (cache bust will use remote)
      setPreviewSrc(null);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // compute image src with cache buster
  const profilePicUrl = data?.profile_pic_url ? `${data.profile_pic_url}?t=${Date.now()}` : null;

  return (
    <div className="bg-[#1f1f1f] min-h-screen p-6 text-white">
      <ToastContainer />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
            <h3 className="text-lg font-semibold">Your Expenses</h3>
            {pagination.totalItems > 0 && (
              <span className="text-sm text-gray-400">{pagination.totalItems} total expenses</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : expenses.length > 0 ? (
            <>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                {expenses.map((exp) => (
                  <div key={exp.eid} className="p-3 rounded-lg bg-gray-800 border border-gray-600 flex justify-between items-center" >
                    <div>
                      <p className="font-medium">{exp.category} - ₹{exp.amount}</p>
                      <p className="text-sm text-gray-400">{exp.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>{exp.day}</p>
                      <p>{new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center space-x-2">
                  <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage}
                    className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition">
                    Previous
                  </button>

                  <div className="flex space-x-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      const shouldShow = pageNum === 1 || pageNum === pagination.totalPages || Math.abs(pageNum - pagination.currentPage) <= 1;
                      if (!shouldShow) {
                        if (pageNum === pagination.currentPage - 2 || pageNum === pagination.currentPage + 2) {
                          return <span key={pageNum} className="px-2">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded transition ${pageNum === pagination.currentPage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage}
                    className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition">
                    Next
                  </button>
                </div>
              )}

              <div className="mt-2 text-center text-xs text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No expenses found.</p>
          )}
        </div>

        {data && (
          <div className="bg-[#2f2f2f] rounded-xl shadow-lg p-6 h-fit">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg mb-3 overflow-hidden">
                { previewSrc ? (
                    <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
                  ) : profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-2xl">{data.username.charAt(0).toUpperCase()}</span>
                  )
                }
              </div>

              <h2 className="text-xl font-semibold">{data.username}</h2>
              <p className="text-sm text-gray-400 mb-2">UID: {data.uid}</p>

              <label className="mt-3 cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">
                {uploading ? 'Uploading...' : 'Change Photo'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              <button className="mt-5 bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold transition cursor-pointer" onClick={handleLogout}>
                LogOut
              </button>

              {data.profile_pic_url && (
                <p className="text-xs text-gray-400 mt-3">Uploaded photo</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
