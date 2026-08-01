import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home/Home/Home";
import ServiceAreas from "../pages/ServiceAreas/ServiceAreas";
import Services from "../pages/Services/Services";
import About from "../pages/About/About";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/Auth/Login/Login";
import Register from "../pages/Auth/Register/Register";
import PrivateRoute from "./PrivateRoute";
import BecomeTechnician from "../pages/BecomeTechnician/BecomeTechnician";
import CreateRequest from "../pages/Dashboard/CreateRequest/CreateRequest";
import DashboardLayout from "../layouts/DashboardLayout";
import MyRequests from "../pages/Dashboard/MyRequests/MyRequests";
import Payment from "../pages/Dashboard/Payment/Payment";
import PaymentSuccess from "../pages/Dashboard/Payment/PaymentSuccess";
import PaymentCancelled from "../pages/Dashboard/Payment/PaymentCancelled";
import PaymentHistory from "../pages/Dashboard/PaymentHistory/PaymentHistory";
import ApproveTechnicians from "../pages/Dashboard/ApproveTechnicians/ApproveTechnicians";
import UsersManagement from "../pages/Dashboard/UsersManagement/UsersManagement";
import AdminRoute from "./AdminRoute";
import CustomerRoute from "./CustomerRoute";
import AssignTechnicians from "../pages/Dashboard/AssignTechnicians/AssignTechnicians";
import TechnicianRoute from "./TechnicianRoute";
import AssignedJobs from "../pages/Dashboard/AssignedJobs/AssignedJobs";
import CompletedJobs from "../pages/Dashboard/CompletedJobs/CompletedJobs";
import TrackRequest from "../pages/TrackRequest/TrackRequest";
import DashboardHome from "../pages/Dashboard/DashboardHome/DashboardHome";
import RequestDetails from "../pages/Dashboard/RequestDetails/RequestDetails";
import Profile from "../pages/Dashboard/Profile/Profile";
import ManageRepairRequests from "../pages/Dashboard/ManageRepairRequests/ManageRepairRequests";
import NotificationsPage from "../pages/Dashboard/Notifications/NotificationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Home
      },
      {
        path: 'become-technician',
        element: <PrivateRoute><BecomeTechnician></BecomeTechnician></PrivateRoute>,
        loader: () => fetch('/serviceAreas.json').then(res => res.json())
      },
      {
        path: 'service-areas',
        Component: ServiceAreas,
        loader: () => fetch('/serviceAreas.json').then(res => res.json())
      },
      {
        path: 'services',
        Component: Services
      },
      {
        path: 'about',
        Component: About
      },
      {
        path: 'track-request',
        Component: TrackRequest
      },
      {
        path: 'track-request/:requestId',
        Component: TrackRequest
      }
    ]
  },
  {
    path: '/',
    Component: AuthLayout,
    children: [
      {
        path: 'login',
        Component: Login
      },
      {
        path: 'register',
        Component: Register
      }
    ]
  },
  {
    path: 'dashboard',
    element: <PrivateRoute><DashboardLayout></DashboardLayout></PrivateRoute>,
    children: [
      {
        index: true,
        Component: DashboardHome
      },
      {
        path: 'create-request',
        element: <CustomerRoute><CreateRequest></CreateRequest></CustomerRoute>,
        loader: () => fetch('/serviceAreas.json').then(res => res.json())
      },
      {
        path: 'my-requests',
        element: <CustomerRoute><MyRequests></MyRequests></CustomerRoute>
      },
      {
        path: 'my-requests/:id',
        element: <CustomerRoute><RequestDetails></RequestDetails></CustomerRoute>
      },
      {
        path: 'profile',
        Component: Profile
      },
      {
        // Role-independent, like 'profile' above - PrivateRoute already
        // wraps this whole dashboard tree, and every authenticated role
        // (user/rider/admin) can receive notifications, so no additional
        // CustomerRoute/TechnicianRoute/AdminRoute wrapper is needed here.
        path: 'notifications',
        Component: NotificationsPage
      },
      {
        path: 'payment/:requestId',
        element: <CustomerRoute><Payment></Payment></CustomerRoute>
      },
      {
        path: 'payment-history',
        element: <CustomerRoute><PaymentHistory></PaymentHistory></CustomerRoute>
      },
      {
        path: 'payment-success',
        element: <CustomerRoute><PaymentSuccess></PaymentSuccess></CustomerRoute>
      },
      {
        path: 'payment-cancelled',
        element: <CustomerRoute><PaymentCancelled></PaymentCancelled></CustomerRoute>
      },
      // technician only routes
      {
        path: 'assigned-jobs',
        element: <TechnicianRoute><AssignedJobs></AssignedJobs></TechnicianRoute>
      },
      {
        path: 'completed-jobs',
        element: <TechnicianRoute><CompletedJobs></CompletedJobs></TechnicianRoute>
      },

      // admin only routes
      {
        path: 'approve-technicians',
        element: <AdminRoute><ApproveTechnicians></ApproveTechnicians></AdminRoute>
      },
      {
        path: 'assign-technicians',
        element: <AdminRoute><AssignTechnicians></AssignTechnicians></AdminRoute>
      },
      {
        path: 'users-management',
        element: <AdminRoute><UsersManagement></UsersManagement></AdminRoute>
      },
      {
        path: 'manage-repair-requests',
        element: <AdminRoute><ManageRepairRequests></ManageRepairRequests></AdminRoute>
      },
      {
        path: 'manage-repair-requests/:id',
        element: <AdminRoute><RequestDetails></RequestDetails></AdminRoute>
      }
    ]
  }
]);
