import Cookies from 'js-cookie';

const Nav = () => {
  const cookieData = Cookies.get('UserData');
  
    let userData;

  if (cookieData) {
    try {
      const jsonStr = cookieData.startsWith('j:') ? cookieData.slice(2) : cookieData;
       userData = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Invalid cookie data', error);
    }
  }

  return (
    <nav className="w-full mx-auto py-4 flex justify-between items-center">
      <h1 className="text-4xl font-bold text-white">ET</h1>

      <div className="flex items-center gap-4">
        <span className="text-lg text-white">Hi, {userData.username}</span>
        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold cursor-pointer" >
          {userData.username.charAt(0).toUpperCase()}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
