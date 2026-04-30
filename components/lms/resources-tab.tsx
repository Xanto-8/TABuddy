'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Archive, ExternalLink, Download } from 'lucide-react'
import AddResourceModal from './add-resource-modal'
import EditResourceModal from './edit-resource-modal'

export default function ResourcesTab({ classId }: { classId: string }) {
  const [resources, setResources] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadResources = () => {
    const { getResourcesByClass } = require('@/lib/store')
    setResources(getResourcesByClass(classId))
  }

  useEffect(() => {
    loadResources()
  }, [classId])

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个资料吗？')) {
      const { deleteResource } = require('@/lib/store')
      deleteResource(id)
      loadResources()
    }
  }

  const getTypeIcon = (type: string) => {
    const { getResourceTypeIcon } = require('@/lib/store')
    return getResourceTypeIcon(type)
  }

  const getTypeLabel = (type: string) => {
    const { getResourceTypeLabel } = require('@/lib/store')
    return getResourceTypeLabel(type)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">班级仓库</h3>
          <p className="text-sm text-muted-foreground mt-1">
            存放共享文档、作业答案、学习资料等
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加资料
        </button>
      </div>

      <AnimatePresence mode="wait">
        {resources.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">仓库为空</h3>
            <p className="text-muted-foreground mb-6">
              还没有添加任何资料，点击上方按钮添加共享文档、作业答案等
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加资料
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="resources-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {resources.map((resource: any, index: number) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group relative flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 ease-out"
              >
                <div className="p-2.5 rounded-lg bg-primary/5 shrink-0">
                  <span className="text-xl">{getTypeIcon(resource.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {resource.title}
                      </h4>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {getTypeLabel(resource.type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingResource(resource)
                          setShowEditModal(true)
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {resource.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  {resource.fileName ? (
                    <a
                      href={resource.url}
                      download={resource.originalName || resource.fileName}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{resource.fileName}</span>
                    </a>
                  ) : (
                    resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{resource.url}</span>
                      </a>
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showAddModal && (
        <AddResourceModal
          classId={classId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false)
            loadResources()
          }}
        />
      )}

      {showEditModal && editingResource && (
        <EditResourceModal
          resource={editingResource}
          onClose={() => {
            setShowEditModal(false)
            setEditingResource(null)
          }}
          onSaved={() => {
            setShowEditModal(false)
            setEditingResource(null)
            loadResources()
          }}
        />
      )}
    </div>
  )
}
