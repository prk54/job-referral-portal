import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ReferrerDashboard } from "@/pages/ReferrerDashboard";
import { SeekerDashboard } from "@/pages/SeekerDashboard";
import { PostJob } from "@/pages/PostJob";

function ReferrerRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role !== "referrer") return <Navigate to="/seeker" replace />;
  return <>{children}</>;
}

function SeekerRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role !== "seeker") return <Navigate to="/referrer" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/referrer"
        element={
          <Layout>
            <ReferrerRoute>
              <ReferrerDashboard />
            </ReferrerRoute>
          </Layout>
        }
      />
      <Route
        path="/post-job"
        element={
          <Layout>
            <ReferrerRoute>
              <PostJob />
            </ReferrerRoute>
          </Layout>
        }
      />
      <Route
        path="/seeker"
        element={
          <Layout>
            <SeekerRoute>
              <SeekerDashboard />
            </SeekerRoute>
          </Layout>
        }
      />
      <Route
        path="/"
        element={
          profile ? (
            <Navigate
              to={profile.role === "referrer" ? "/referrer" : "/seeker"}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
