import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home/Home/Home";
import AuthLayout from "../layouts/AuthLayout";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import CustomerRoute from "./CustomerRoute";
import TechnicianRoute from "./TechnicianRoute";
import ApplicationLayout from "../layouts/ApplicationLayout";
import RouteError from "../pages/Shared/RouteError/RouteError";
import NotFound from "../pages/Shared/NotFound/NotFound";

// Route-level code splitting (redesign Phase 6). The public and auth layouts,
// the route guards and the homepage load up front; the dashboard shell and
// every other page load when first visited, so a visitor to the homepage no
// longer downloads the dashboards, charts, tables and map. Each layout wraps
// its <Outlet/> in a Suspense boundary (RouteSuspense), so a page that is
// still loading shows a small loading state inside the layout, never a blank
// screen.
const ServiceAreas = lazy(() => import("../pages/ServiceAreas/ServiceAreas"));
const Services = lazy(() => import("../pages/Services/Services"));
const About = lazy(() => import("../pages/About/About"));
const Login = lazy(() => import("../pages/Auth/Login/Login"));
const Register = lazy(() => import("../pages/Auth/Register/Register"));
const VerifyEmail = lazy(() => import("../pages/Auth/VerifyEmail/VerifyEmail"));
const BecomeTechnician = lazy(() => import("../pages/BecomeTechnician/BecomeTechnician"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const RepairRequestV2Form = lazy(() => import("../components/repair-request/RepairRequestV2Form"));
const MyRequests = lazy(() => import("../pages/Dashboard/MyRequests/MyRequests"));
const Payment = lazy(() => import("../pages/Dashboard/Payment/Payment"));
const PaymentSuccess = lazy(() => import("../pages/Dashboard/Payment/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("../pages/Dashboard/Payment/PaymentCancelled"));
const PaymentHistory = lazy(() => import("../pages/Dashboard/PaymentHistory/PaymentHistory"));
const ApproveTechnicians = lazy(() => import("../pages/Dashboard/ApproveTechnicians/ApproveTechnicians"));
const UsersManagement = lazy(() => import("../pages/Dashboard/UsersManagement/UsersManagement"));
const AssignTechnicians = lazy(() => import("../pages/Dashboard/AssignTechnicians/AssignTechnicians"));
const AssignedJobs = lazy(() => import("../pages/Dashboard/AssignedJobs/AssignedJobs"));
const CompletedJobs = lazy(() => import("../pages/Dashboard/CompletedJobs/CompletedJobs"));
const TrackRequest = lazy(() => import("../pages/TrackRequest/TrackRequest"));
const DashboardHome = lazy(() => import("../pages/Dashboard/DashboardHome/DashboardHome"));
const RequestDetails = lazy(() => import("../pages/Dashboard/RequestDetails/RequestDetails"));
const Profile = lazy(() => import("../pages/Dashboard/Profile/Profile"));
const ManageRepairRequests = lazy(() => import("../pages/Dashboard/ManageRepairRequests/ManageRepairRequests"));
const NotificationsPage = lazy(() => import("../pages/Dashboard/Notifications/NotificationsPage"));
const Wallet = lazy(() => import("../pages/Dashboard/Wallet/Wallet"));
const WithdrawalRequests = lazy(() => import("../pages/Dashboard/WithdrawalRequests/WithdrawalRequests"));
const AdminFeedbackPage = lazy(() => import("../pages/Dashboard/TechnicianFeedback/AdminFeedbackPage"));
const ServiceCatalogue = lazy(() => import("../pages/Dashboard/ServiceCatalogue/ServiceCatalogue"));

export const router = createBrowserRouter([
  {
    Component: ApplicationLayout,
    // Any routing or render error, including a page chunk that no longer
    // exists after a deploy (Phase 6). Imported eagerly so it still works
    // when loading code is what failed.
    errorElement: <RouteError />,
    children: [
      {
        path: "/",
        Component: RootLayout,
        children: [
      {
        index: true,
        Component: Home,
        // Coverage counts for the homepage "Where we work" section. A failed
        // fetch must never take the homepage down, so it degrades to an empty
        // list and the section simply does not render.
        loader: () => fetch('/serviceAreas.json').then((res) => (res.ok ? res.json() : [])).catch(() => [])
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
      },
      {
        // Any unknown address, inside the public layout (Phase 6).
        path: '*',
        Component: NotFound
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
      // Redesign reference page (Phase 1). Development builds only: in a
      // production build import.meta.env.DEV is false, so the route and its
      // lazily imported module are dropped entirely.
      ...(import.meta.env.DEV
        ? [{
          path: 'design-preview',
          lazy: async () => ({ Component: (await import('../pages/DesignPreview/DesignPreview')).default }),
        }]
        : []),
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
        path: 'technician-reports',
        element: <AdminRoute><AdminFeedbackPage kind="reports" /></AdminRoute>
      },
      {
        path: 'technician-reviews',
        element: <AdminRoute><AdminFeedbackPage kind="reviews" /></AdminRoute>
      },
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
      },
      {
        // Admin service catalogue: prices and on/off for each repair service.
        path: 'service-catalogue',
        element: <AdminRoute><ServiceCatalogue></ServiceCatalogue></AdminRoute>
      }
    ]
      }
    ]
  }
]);
