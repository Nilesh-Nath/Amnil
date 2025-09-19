import axios from "axios";
import { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { useContext } from "react";
import { AuthContext } from "../Pages/AuthContext";

const Summary = () => {
  const [loading, setLoading] = useState(true);
  const [income ,setIncome] = useState(0);
  const [TotalExpense, SetTotalExpense] = useState(0);
  const [Savings,setSavings] = useState(0);
  const { accessToken } = useContext(AuthContext);

  useEffect(() => {
    // const cookieStr = Cookies.get('UserData');
    // if (cookieStr) {
    //   try {
    //     const cleanStr = cookieStr.startsWith('j:') ? cookieStr.slice(2) : cookieStr;
    //     const inc = JSON.parse(cleanStr);

    //     setIncome(inc.income);
    //     console.log('Parsed UserData:', inc);
    //   } catch (err) {
    //     console.error('Failed to parse UserData cookie:', cookieStr, err);
    //   }
    // }
    
    // handleFetch();

    handleBalanceSummary();
    // eslint-disable-next-line
  }, []);


  const handleBalanceSummary = async ()=>{
    try{
        const response = await axios.get('http://localhost:5000/getBalance',{withCredentials:true,headers : {'Authorization' : `Bearer ${accessToken}`}})
        SetTotalExpense(response.data.data.TotalExpenses);
        setIncome(response.data.data.TotalIncome);
        setSavings(response.data.data.Savings);
    }catch(err){
        console.log("Error while fetching data",err);
    }finally{
      setLoading(false);
    }
  }

  // const getWeekNumber = (dateString) => {
//     const date = new Date(dateString);
//     const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
//     const dayOfMonth = date.getDate();
//     const adjustedDate = dayOfMonth + startOfMonth.getDay();
//     return Math.ceil(adjustedDate / 7);
// };


  // const formatMonth = (dateString) => {
  //   return new Date(dateString).toLocaleString("default", { month: "long" });
  // };

  // const getYear = (dateString) => {
  //   return new Date(dateString).getFullYear();
  // };

  return (
    <div className="bg-[#2f2f2f] w-full max-w-md mx-auto mt-10 p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-6 text-center">Weekly Summary</h2>

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) :  (
        <div className="space-y-4">
          {/* <div className="bg-[#3f3f3f] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Week</span>
              <span>Month</span>
              <span>Year</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Week {getWeekNumber(data.date)}</span>
              <span>{formatMonth(data.date)}</span>
              <span>{getYear(data.date)}</span>
            </div>
          </div> */}

          <div className="grid grid-cols-2 gap-4 ">
            <div className="bg-green-600 bg-opacity-20 border border-green-400 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-1">Income</p>
              <p className="text-xl font-semibold text-green-400">Rs. {income}</p>
            </div>

            <div className="bg-red-600 bg-opacity-20 border border-red-400 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-1">Expenses</p>
              <p className="text-xl font-semibold text-red-400">Rs. {TotalExpense ? TotalExpense : 0}</p>
            </div>

             <div className="bg-yellow-600 bg-opacity-20 border border-yellow-400 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-1">Savings</p>
              <p className="text-xl font-semibold text-yellow-400">Rs. {Savings}</p>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
};

export default Summary;
