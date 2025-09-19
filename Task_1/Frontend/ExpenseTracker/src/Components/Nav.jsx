import { useContext } from 'react';
import { AuthContext } from '../Pages/AuthContext';
import { useNavigate } from 'react-router-dom';

const Nav = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate();

  return (
    <nav className="w-full mx-auto py-4 flex justify-between items-center">
      <h1 className="text-4xl font-bold text-white">ET</h1>

      <div className="flex items-center gap-4">
        <span className="text-lg text-white">Hi, {user || ' '}</span>
        {user ? (
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold cursor-pointer" onClick={()=>navigate("/Profile")}>
            {user.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center font-semibold cursor-pointer">
            ?
          </div>
        )}
      </div>

    </nav>
  );
};

export default Nav;
