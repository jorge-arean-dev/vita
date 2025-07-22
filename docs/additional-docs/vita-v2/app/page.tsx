"use client"

import { useState } from "react"
import Header from "../header"
import Sidebar from "../sidebar"
import JobsTable from "../jobs-table"
import JobDetails from "../job-details"

export default function Page() {
  const [activeSection, setActiveSection] = useState("jobs")
  const [selectedJob, setSelectedJob] = useState<{ id: number; title: string; company: string } | null>(null)

  const handleJobOpen = (job: { id: number; title: string; company: string }) => {
    setSelectedJob(job)
  }

  const handleBackToJobs = () => {
    setSelectedJob(null)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "jobs":
        if (selectedJob) {
          return <JobDetails job={selectedJob} onBack={handleBackToJobs} />
        }
        return <JobsTable onJobOpen={handleJobOpen} />
      case "candidates":
        return (
          <div>
            <h1 className="text-3xl font-bold">Candidates</h1>
            <p className="mt-2 text-muted-foreground">Candidates section coming soon...</p>
          </div>
        )
      case "companies":
        return (
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="mt-2 text-muted-foreground">Companies section coming soon...</p>
          </div>
        )
      case "settings":
        return (
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="mt-2 text-muted-foreground">Settings section coming soon...</p>
          </div>
        )
      default:
        return (
          <div>
            <h1 className="text-3xl font-bold">Welcome to Vita</h1>
            <p className="mt-2 text-muted-foreground">Your Virtual Interface for Talent Acquisition</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
