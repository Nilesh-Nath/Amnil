import React, { useState, useEffect , useContext } from 'react';
import axios from 'axios';
import { toast , ToastContainer } from 'react-toastify'

import { AuthContext } from '../Pages/AuthContext';

const EditExpenseModal = ({ expense, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    day: '',
    category: '',
    amount: '',
    description: '',
  });

  const { accessToken } = useContext(AuthContext);

  useEffect(() => {
    if (expense) {
      setFormData({
        day: expense.day,
        category: expense.category,
        amount: expense.amount,
        description: expense.description || '',
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5000/api/expenses/${expense.eid}`,
        { ...formData },
        { withCredentials: true ,headers : {'Authorization' : `Bearer ${accessToken}`} }
      );
      onUpdate();
      onClose();
      toast.info('Expense modified!')
    } catch (err) {
      console.error('Error updating expense:', err);
      toast.error(err.response.data.msg)
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-[#2f2f2f] w-full max-w-md p-6 rounded-xl shadow-lg text-white relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-center">Edit Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Day</label>
            <select
              name="day"
              value={formData.day}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            >
              <option value="">Select Day</option>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            >
              <option value="">Select Category</option>
              {["Food", "Transport", "Shopping", "Entertainment", "Bills", "Other"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              placeholder="Enter description"
              rows="3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded font-semibold transition"
          >
            Update Expense
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
