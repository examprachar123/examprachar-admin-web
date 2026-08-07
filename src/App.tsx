import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { StatesPage } from '@/routes/states/StatesPage'
import { TagsPage } from '@/routes/tags/TagsPage'
import { ProfileOptionsPage } from '@/routes/profile-options/ProfileOptionsPage'
import { BroadcastsPage } from '@/routes/broadcasts/BroadcastsPage'
import { LatestExamFormPage } from '@/routes/posts/latest-exam/LatestExamFormPage'
import { LatestExamListPage } from '@/routes/posts/latest-exam/LatestExamListPage'
import { AdmitCardFormPage } from '@/routes/posts/admit-card/AdmitCardFormPage'
import { AdmitCardListPage } from '@/routes/posts/admit-card/AdmitCardListPage'
import { ResultFormPage } from '@/routes/posts/result/ResultFormPage'
import { ResultListPage } from '@/routes/posts/result/ResultListPage'
import { UpcomingExamFormPage } from '@/routes/posts/upcoming-exam/UpcomingExamFormPage'
import { UpcomingExamListPage } from '@/routes/posts/upcoming-exam/UpcomingExamListPage'
import { TrackedAlertFormPage } from '@/routes/posts/tracked-alert/TrackedAlertFormPage'
import { TrackedAlertListPage } from '@/routes/posts/tracked-alert/TrackedAlertListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/states"
        element={
          <ProtectedRoute>
            <StatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            <TagsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-options"
        element={
          <ProtectedRoute>
            <ProfileOptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broadcasts"
        element={
          <ProtectedRoute>
            <BroadcastsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/latest-exam"
        element={
          <ProtectedRoute>
            <LatestExamListPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/latest-exam/new"
        element={
          <ProtectedRoute>
            <LatestExamFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/latest-exam/:id/edit"
        element={
          <ProtectedRoute>
            <LatestExamFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/latest-exam"
        element={
          <ProtectedRoute>
            <LatestExamListPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/latest-exam/new"
        element={
          <ProtectedRoute>
            <LatestExamFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/latest-exam/:id/edit"
        element={
          <ProtectedRoute>
            <LatestExamFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/admit-card"
        element={
          <ProtectedRoute>
            <AdmitCardListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/admit-card/new"
        element={
          <ProtectedRoute>
            <AdmitCardFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/admit-card/:id/edit"
        element={
          <ProtectedRoute>
            <AdmitCardFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/result"
        element={
          <ProtectedRoute>
            <ResultListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/result/new"
        element={
          <ProtectedRoute>
            <ResultFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/result/:id/edit"
        element={
          <ProtectedRoute>
            <ResultFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/upcoming-exam"
        element={
          <ProtectedRoute>
            <UpcomingExamListPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/upcoming-exam/new"
        element={
          <ProtectedRoute>
            <UpcomingExamFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/upcoming-exam/:id/edit"
        element={
          <ProtectedRoute>
            <UpcomingExamFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/upcoming-exam"
        element={
          <ProtectedRoute>
            <UpcomingExamListPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/upcoming-exam/new"
        element={
          <ProtectedRoute>
            <UpcomingExamFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/upcoming-exam/:id/edit"
        element={
          <ProtectedRoute>
            <UpcomingExamFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracked-alerts"
        element={
          <ProtectedRoute>
            <TrackedAlertListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/tracked-alert/new"
        element={
          <ProtectedRoute>
            <TrackedAlertFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-updates/tracked-alert/:id/edit"
        element={
          <ProtectedRoute>
            <TrackedAlertFormPage variant="all-updates" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/tracked-alert/new"
        element={
          <ProtectedRoute>
            <TrackedAlertFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized/tracked-alert/:id/edit"
        element={
          <ProtectedRoute>
            <TrackedAlertFormPage variant="personalized" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
