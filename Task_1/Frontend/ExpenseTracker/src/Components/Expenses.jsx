import axios from "axios";
import { useState, useEffect } from "react";
import EditExpenseModal from "./EditExpenseModal";
import { toast , ToastContainer } from 'react-toastify';
import { useContext } from "react";
import { AuthContext } from "../Pages/AuthContext";

const Expenses = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const { accessToken } = useContext(AuthContext);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/expenses", {
        withCredentials: true,
        headers : {'Authorization' : `Bearer ${accessToken}`}
      });
      setData(response.data.data || []);
    } catch (err) {
      console.error("Error while fetching data!", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eid) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${eid}`, {
        withCredentials: true,headers : {'Authorization' : `Bearer ${accessToken}`}
      });
      setData((prev) => prev.filter((item) => item.eid !== eid));
      toast.error('Expense deleted!')
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast.error(err.response.data.msg)
    }
  };

  const handleEdit = (expense) => {
  setEditingExpense(expense);
};


  return (
    <div className="bg-[#2f2f2f] w-full max-w-md mx-auto mt-10 p-6 rounded-xl shadow-lg text-white">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-center">Your Expenses</h1>

      {loading ? (
        <div className="text-center text-gray-300">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400">No expenses found.</div>
      ) : (
        <ul className="space-y-4">
          {data.map((expense) => (
            <li
              key={expense.eid}
              className="bg-[#3d3d3d] p-4 rounded-lg shadow flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">{expense.category}</span>
                <span className="text-green-400 font-semibold">
                  Rs.{expense.amount}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{expense.day}</span>
                {expense.description && (
                  <span className="italic truncate max-w-[60%] text-right">
                    {expense.description}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                    onClick={() => handleEdit(expense)}
                    className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded-md cursor-pointer"
                    >
                    Edit
                </button>
                <button
                  onClick={() => handleDelete(expense.eid)}
                  className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 rounded-md cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingExpense && (
        <EditExpenseModal
            expense={editingExpense}
            onClose={() => setEditingExpense(null)}
            onUpdate={handleFetch} 
        />
    )}
    </div>
    
  );
};

export default Expenses;
