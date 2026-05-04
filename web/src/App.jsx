import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './store/slices/authSlice';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import DashboardPage from './pages/main/DashboardPage';
import GoalsPage from './pages/main/GoalsPage';
import GoalDetailPage from './pages/main/GoalDetailPage';
import CreateGoalPage from './pages/main/CreateGoalPage';
import HabitsPage from './pages/main/HabitsPage';
import CreateHabitPage from './pages/main/CreateHabitPage';
import AnalyticsPage from './pages/main/AnalyticsPage';
import ProfilePage from './pages/main/ProfilePage';

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(loadUser());
  }, [dispatch]);

  return (
    <Routes>
      {/* Auth */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
      <Route path="/goals/new" element={<PrivateRoute><CreateGoalPage /></PrivateRoute>} />
      <Route path="/goals/:id" element={<PrivateRoute><GoalDetailPage /></PrivateRoute>} />
      <Route path="/goals/:id/edit" element={<PrivateRoute><CreateGoalPage /></PrivateRoute>} />
      <Route path="/habits" element={<PrivateRoute><HabitsPage /></PrivateRoute>} />
      <Route path="/habits/new" element={<PrivateRoute><CreateHabitPage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Default */}
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
