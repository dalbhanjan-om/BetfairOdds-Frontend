import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/login/login";
import ListEvent from "../pages/listEvents/listEvent";
import EventPage from "../pages/listEvents/EventPage";

import BotPage from "../pages/BotPage/BotPage";

import ProtectedLayout from "../components/ProtectedLayout";
import Summary from "../pages/Summary/Summary";


const AppRoutes = () => {
  return (
    <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes with tabs */}
        <Route 
          path="/listEvents" 
          element={
            <ProtectedLayout>
              <ListEvent />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/event" 
          element={
            <ProtectedLayout>
              <EventPage />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/summary" 
          element={
            <ProtectedLayout>
              <Summary/>
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/bot" 
          element={
            <ProtectedLayout>
              <BotPage />
            </ProtectedLayout>
          } 
        />
        
        {/* Fallback to login for any unknown route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;