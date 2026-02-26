'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { TextEffect } from '@/components/ui/text-effect'
import { UserButton, useAuth } from '@clerk/nextjs'
import { Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
} as const

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<Id<"projects"> | null>(null)

  const projects = useQuery(
    api.projects.getUserProjects,
    isLoaded && isSignedIn ? {} : "skip"
  )
  const createProject = useMutation(api.projects.createProject)
  const deleteProject = useMutation(api.projects.deleteProject)

  const handleCreateProject = async () => {
    if (!projectName.trim() || isCreatingProject) return

    setIsCreatingProject(true)
    try {
      await createProject({
        name: projectName,
        description: projectDesc || undefined,
      })
      setProjectName('')
      setProjectDesc('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleDeleteProject = async (projectId: Id<"projects">, projectName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingProjectId(projectId)
    try {
      await deleteProject({ projectId })
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setDeletingProjectId(null)
    }
  }

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-foreground/20 border-t-foreground rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isSignedIn) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative Background Gradients */}
      <div
        aria-hidden
        className="fixed inset-0 isolate hidden opacity-40 contain-strict lg:block -z-50">
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-background/50 border-b border-foreground/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground">Manage your AI analysis projects</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsCreating(!isCreating)}
              className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Create Project Form - Modal Style */}
        {isCreating && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => !isCreatingProject && setIsCreating(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <AnimatedGroup 
                variants={transitionVariants} 
                className="w-full max-w-2xl bg-background border border-foreground/10 rounded-2xl shadow-2xl shadow-zinc-950/20 dark:shadow-zinc-950/40 overflow-hidden">
                {/* Modal Header */}
                <div className="relative border-b border-foreground/10 px-8 py-6 bg-linear-to-br from-foreground/5 to-foreground/2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Create New Project</h2>
                      <p className="text-sm text-muted-foreground">Start a new AI analysis project</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false)
                        setProjectName('')
                        setProjectDesc('')
                      }}
                      disabled={isCreatingProject}
                      className="rounded-lg h-8 w-8 p-0 hover:bg-foreground/10 disabled:opacity-50">
                      <span className="text-xl">×</span>
                    </Button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-8 py-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && projectName.trim() && !isCreatingProject) {
                          handleCreateProject()
                        }
                      }}
                      placeholder="e.g., Customer Behavior Analysis"
                      autoFocus
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/20 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Description <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      placeholder="Describe what you want to analyze and achieve with this project..."
                      rows={4}
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/20 transition-all resize-none text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 bg-muted/30 border-t border-foreground/10 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setProjectName('')
                      setProjectDesc('')
                    }}
                    disabled={isCreatingProject}
                    className="rounded-xl px-6">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim() || isCreatingProject}
                    className="rounded-xl px-6 bg-foreground text-background hover:bg-foreground/90">
                    {isCreatingProject ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </AnimatedGroup>
            </div>
          </>
        )}

        {/* Projects Grid */}
        {projects === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        ) : projects.length > 0 ? (
          <AnimatedGroup
            key="projects-grid"
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              },
              ...transitionVariants,
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-20">
            {projects.map((project) => (
              <div
                key={project._id}
                className="group relative bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-6 hover:border-foreground/20 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-950/10 dark:hover:shadow-zinc-950/30"
                style={{ opacity: deletingProjectId === project._id ? 0.5 : 1 }}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-foreground/10 group-hover:bg-foreground/20 transition-colors">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold line-clamp-1">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Meta */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg">
                    <Link href={`/dashboard/project/${project._id}`}>
                      <FolderOpen className="mr-2 h-3.5 w-3.5" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleDeleteProject(project._id, project.name)}
                    disabled={deletingProjectId === project._id}>
                    {deletingProjectId === project._id ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </AnimatedGroup>
        ) : (
          <AnimatedGroup key="empty-state" variants={transitionVariants} className="text-center py-12">
            <div className="mb-6">
              <div className="inline-block p-3 rounded-full bg-foreground/5 mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <TextEffect
              preset="fade-in-blur"
              as="h2"
              className="text-2xl font-semibold mb-2">
              No Projects Yet
            </TextEffect>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Create your first project to get started with AI analysis
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </AnimatedGroup>
        )}
      </main>
    </div>
  )
}
