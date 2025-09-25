import React, { useState } from 'react';
import axios from 'axios'
import Cookies from 'js-cookie'
import { toast , ToastContainer } from 'react-toastify';
import { useContext } from 'react';
import { AuthContext } from '../Pages/AuthContext';

const AddExpense = () => {
  const { accessToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    day: '',
    category: '',
    amount: '',
    description: '',
  });

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
        await axios.post('http://localhost:5000/api/expenses',{formData},{withCredentials:true , headers : {'Authorization' : `Bearer ${accessToken}`}})
        setFormData({
          day: '',
          category: '',
          amount: '',
          description: ''
        })
        toast.success('Expense recorded, Refresh the page !')
    }catch(err){
        console.log(`Error occured : ${err}`);
        toast.error(err.response.data.msg)
    }
  };

  return (
    <div className="bg-[#2f2f2f] w-full max-w-md mx-auto mt-10 p-6 rounded-xl shadow-lg text-white">
      <ToastContainer />
      <h2 className="text-2xl font-semibold mb-6 text-center">Add Expense</h2>
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
          className="w-full bg-red-500 hover:bg-red-700 text-white py-2 rounded font-semibold transition cursor-pointer"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
