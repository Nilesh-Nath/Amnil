import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const ExpensePerDay = () => {

    const [labels,setLabels] = useState([]);
    const [expenses,setExpenses] = useState([]);

    useEffect(()=>{
        fetchData()
    },[])

    const fetchData = async ()=>{
        try{
            const response = await axios.get('http://localhost:5000/getDailyExpense',{withCredentials:true})
            const data = response.data.data;

            const days = data.map(item=>item.day)
            const expense = data.map(item=>parseInt(item.sum))

            setLabels(days);
            setExpenses(expense);

        }catch(err){
            console.log(`Data fetch Error : ${err}`);
        }
    }

    const data = {
    labels: labels,
    datasets: [
      {
        label: 'Expenses',
        data: expenses,
        backgroundColor: 'rgba(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

 const options = {
    responsive: true,
    plugins: {
        legend: {
        labels: {
            color: 'white',
        },
        },
        tooltip: {
        titleColor: 'white',
        bodyColor: 'white',
        backgroundColor: '#333',
        },
    },
    scales: {
       x: {
      ticks: {
        color: 'white',
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)', 
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: 'white',
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    },
  };

  return <div className='mt-16 w-full' style={{ width: '800px', height: '450px' }}>
            <Bar data={data} options={options} />
        </div>
}

export default ExpensePerDay
