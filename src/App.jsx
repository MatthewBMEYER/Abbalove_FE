// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

//---Auth Layouts and Pages---
import AuthLayout from './layouts/AuthLayout';
//---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword';
import SetPassword from './pages/auth/SetPassword';

//---Main Layouts and Pages---
import MainLayout from './layouts/MainLayout';
//---
import Dashboard from './pages/Dashboard';

// worships
// import Schedule from './pages/worships/Schedule';
// import Collections from './pages/worships/Collections';
import Giving from './pages/worships/Giving';
// videos collections
import VideoCollection from './pages/worships/videos/videosCollection';
import NewVideo from './pages/worships/videos/newVideo';
import VideoManage from './pages/worships/videos/videosManage';
import VideoDetail from './pages/worships/videos/videoDetails';
// users
import Users from './pages/users/UserManagement';
import UserDetail from './pages/users/UserDetail';
// settings
import Settings from './pages/settings/Settings';
import Profile from './pages/settings/Profile';
// teams
import MainTeam from './pages/teams/MainTeam';
import OtherTeam from './pages/teams/OtherTeam';
import MemberDetail from './pages/teams/MemberDetail';

// Comsell
import AllComsell from './pages/comsell/AllComcell';
import MyComsell from './pages/comsell/MyComcell';
import ComcellGroupDetail from './pages/comsell/ComcellGroupDetail';

// 404
import NotFoundPage from './pages/Uavailable404';
import Calendar from './pages/Calendar';




function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Pages */}
        <Route path="/" element={
          <AuthLayout >
            <Login />
          </AuthLayout>
        } />
        <Route path="/register" element={
          <AuthLayout >
            <Register />
          </AuthLayout>
        } />
        <Route path="/reset-password" element={
          <AuthLayout >
            <ResetPassword />
          </AuthLayout>
        } />
        <Route path="/set-password/:token" element={
          <AuthLayout>
            <SetPassword />
          </AuthLayout>
        } />

        {/* Main Pages */}
        <Route path="/" element={<MainLayout />}>

          {/* Main Pages */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/user/profile" element={<Profile />} />

          {/* Worships */}
          {/* <Route path="worship/schedule" element={<Schedule />} />
          <Route path="worship/collections" element={<Collections />} /> */}
          <Route path="worship/giving" element={<Giving />} />
          <Route path="calendar" element={<Calendar />} />


          {/* Videos */}
          <Route path="worship/video/collections" element={<VideoCollection />} />
          <Route path="worship/video/new" element={<NewVideo />} />
          <Route path="worship/video/manage" element={<VideoManage />} />
          <Route path="worship/video/:id" element={<VideoDetail />} />

          {/* User Management */}
          <Route path="users/management" element={<Users />} />
          <Route path="user/detail/:id" element={<UserDetail />} />

          {/* Teams */}
          <Route path="teams/worship" element={<MainTeam />} />
          <Route path="teams/other" element={<OtherTeam />} />
          <Route path="teams/:teamId/member/detail/:id" element={<MemberDetail />} />

          {/* Comsell */}
          <Route path="comcell/all" element={<AllComsell />} />
          <Route path="comcell/detail/:groupId" element={<ComcellGroupDetail />} />
          <Route path="comcell/mycomcell" element={<MyComsell />} />






        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;