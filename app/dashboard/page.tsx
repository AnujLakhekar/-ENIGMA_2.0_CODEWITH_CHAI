'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { TextEffect } from '@/components/ui/text-effect'
import { UserButton } from '@clerk/nextjs'
import { Id } from '@/convex/_generated/dataModel'

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
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  const projects = useQuery(api.projects.getUserProjects)
  const createProject = useMutation(api.projects.createProject)
  const deleteProject = useMutation(api.projects.deleteProject)

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

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
    }
  }

  const handleDeleteProject = async (projectId: Id<"projects">) => {
    try {
      await deleteProject({ projectId })
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
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
        {/* Create Project Form */}
        {isCreating && (
          <AnimatedGroup variants={transitionVariants} className="mb-12">
            <div className="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg shadow-zinc-950/5 dark:shadow-zinc-950/20">
              <h2 className="text-xl font-semibold mb-6">Create New Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 rounded-lg border border-foreground/10 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Describe your project"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-foreground/10 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setProjectName('')
                      setProjectDesc('')
                    }}
                    className="rounded-lg">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="rounded-lg">
                    Create Project
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedGroup>
        )}

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <AnimatedGroup
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                className="group relative bg-gradient-to-br from-foreground/5 to-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 hover:border-foreground/20 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-950/10 dark:hover:shadow-zinc-950/30">
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
                    onClick={() => handleDeleteProject(project._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </AnimatedGroup>
        ) : (
          <AnimatedGroup variants={transitionVariants} className="text-center py-12">
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
