import AddExpense from '../Components/AddExpense'
import ExpenseByCategory from '../Components/ExpenseByCategory'
import ExpensePerDay from '../Components/ExpensePerDay'
import Expenses from '../Components/Expenses'
import Nav from '../Components/Nav'
import Summary from '../Components/Summary'

const Dashboard = () => {
  return (
    <div className='h-screen bg-[#242424] flex items-start justify-center flex-wrap w-4/5 m-auto'>
      <Nav />
      <div className='flex gap-2 w-3/5 flex-wrap justify-center'>
        <AddExpense />
        <Summary />
        <ExpensePerDay />
        <ExpenseByCategory />
      </div>
      <div className='w-2/5'>
        <Expenses />
      </div>
    </div>
  )
}

export default Dashboard
