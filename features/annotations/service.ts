import { annotationsFor } from "@/lib/db/repositories/annotations"
import { NotFoundError } from "@/lib/errors"
import { listDocumentCollaborators } from "@/lib/db/repositories/document-access"

import type { CreateAnnotationInput, UpdateAnnotationInput } from "./schema"
import type { AnnotationWithTags, TagSummary } from "./types"

async function assertValidAssignee(documentId: string, assigneeId?: string | null) {
  if (!assigneeId) {
    return
  }

  const collaborators = await listDocumentCollaborators(documentId)
  
  if (collaborators.length === 0) {
    throw new NotFoundError("Document")
  }
  
  const isCollaborator = collaborators.some((collaborator) => collaborator.id === assigneeId)

  if (!isCollaborator) {
    throw new NotFoundError("Assignee")
  }
}

export async function listAnnotations(
  userId: string,
  documentId: string
): Promise<AnnotationWithTags[]> {
  return annotationsFor(userId).listByDocument(documentId)
}

export async function createAnnotation(
  userId: string,
  documentId: string,
  input: CreateAnnotationInput
): Promise<AnnotationWithTags> {
  await assertValidAssignee(documentId, input.assigneeId)
  return annotationsFor(userId).create(documentId, input)
}

export async function updateAnnotation(
  userId: string,
  annotationId: string,
  changes: UpdateAnnotationInput
): Promise<AnnotationWithTags> {
  const repo = annotationsFor(userId)
  const existing = await repo.get(annotationId)

  if (!existing) {
    throw new NotFoundError("Annotation")
  }

  await assertValidAssignee(existing.documentId, changes.assigneeId)

  return repo.update(annotationId, changes)
}

export async function softDeleteAnnotation(
  userId: string,
  annotationId: string
): Promise<AnnotationWithTags> {
  const repo = annotationsFor(userId)
  const existing = await repo.get(annotationId)

  if (!existing) {
    throw new NotFoundError("Annotation")
  }

  return repo.softDelete(annotationId)
}

export async function addTagToAnnotation(
  userId: string,
  annotationId: string,
  label: string
): Promise<{ created: boolean; tag: TagSummary }> {
  const result = await annotationsFor(userId).addTag(annotationId, label)

  if (!result) {
    throw new NotFoundError("Annotation")
  }

  return result
}

export async function removeTagFromAnnotation(
  userId: string,
  annotationId: string,
  tagId: string
): Promise<void> {
  const removed = await annotationsFor(userId).removeTag(annotationId, tagId)

  if (!removed) {
    throw new NotFoundError("Annotation")
  }
}

export async function listUserTags(userId: string): Promise<TagSummary[]> {
  return annotationsFor(userId).listTags()
}
