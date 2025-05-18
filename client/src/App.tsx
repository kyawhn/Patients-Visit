import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Calendar from "@/pages/Calendar";
import Records from "@/pages/Records";
import Settings from "@/pages/Settings";
import PatientDetail from "@/pages/PatientDetail";
import RecordDetail from "@/pages/RecordDetail";
import AppointmentDetail from "@/pages/AppointmentDetail";
import Layout from "@/components/Layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/calendar/:date" component={Calendar} />
      <Route path="/appointments/:id" component={AppointmentDetail} />
      <Route path="/records" component={Records} />
      <Route path="/records/:id" component={RecordDetail} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
