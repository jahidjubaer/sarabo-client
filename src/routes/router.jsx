import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home/Home/Home";
import ServiceAreas from "../pages/ServiceAreas/ServiceAreas";
import Services from "../pages/Services/Services";
import About from "../pages/About/About";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/Auth/Login/Login";
import Register from "../pages/Auth/Register/Register";
import VerifyEmail from "../pages/Auth/VerifyEmail/VerifyEmail";
import PrivateRoute from "./PrivateRoute";
import BecomeTechnician from "../pages/BecomeTechnician/BecomeTechnician";
import RepairRequestV2Form from "../components/repair-request/RepairRequestV2Form";
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
import Wallet from "../pages/Dashboard/Wallet/Wallet";
import WithdrawalRequests from "../pages/Dashboard/WithdrawalRequests/WithdrawalRequests";

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
        // Email-verification screen (Phase 8.1). Only needs authentication
        // (PrivateRoute) - reachable by any signed-in unverified user
        // regardless of role, so it must NOT sit behind CustomerRoute. The
        // page itself bounces already-verified users to their destination.
        path: 'verify-email',
        element: <PrivateRoute><VerifyEmail></VerifyEmail></PrivateRoute>
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
        // This single route is the sole customer-facing "Request a Repair"
        // entry point across the app (NavBar, Home, Services, Footer, and the
        // customer dashboard all link here), rendering the v2 request form.
        // The former unrouted legacy CreateRequest component was removed in
        // Phase 7.9's dead-code cleanup.
        path: 'create-request',
        element: <CustomerRoute requireVerified><RepairRequestV2Form></RepairRequestV2Form></CustomerRoute>,
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
        element: <CustomerRoute requireVerified><Payment></Payment></CustomerRoute>
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
        // Assigned technician's detail view (Phase 6.4 Unit 4) - reuses the
        // shared RequestDetails page (which renders the inspection form/summary
        // for the assigned technician). Server-side getRepairRequestById already
        // authorizes the assigned technician.
        path: 'assigned-jobs/:id',
        element: <TechnicianRoute><RequestDetails></RequestDetails></TechnicianRoute>
      },
      {
        path: 'completed-jobs',
        element: <TechnicianRoute><CompletedJobs></CompletedJobs></TechnicianRoute>
      },
      {
        // Technician wallet (Phase 9). Technician-only: the server derives whose
        // wallet this is from the verified token, so the guard here is UX - it
        // keeps a customer or admin from landing on a page that would 403.
        path: 'wallet',
        element: <TechnicianRoute><Wallet></Wallet></TechnicianRoute>
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
      },
      {
        // Admin withdrawal queue (Phase 9) - the single place technician payouts
        // are marked paid or rejected, replacing the retired per-repair
        // technician-earning control on the request detail view.
        path: 'withdrawal-requests',
        element: <AdminRoute><WithdrawalRequests></WithdrawalRequests></AdminRoute>
      }
    ]
  }
]);
