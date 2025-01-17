import { BaseContext, Changeset, EntityType } from '../types'

export interface Comparable {
  sys: {
    id: string
    updatedAt: string
    contentType?: {
      sys: { id: string }
    }
  }
}

export interface EntityData {
  ids: Array<string>
  comparables: Array<Comparable>
}

export interface EntityStatistics {
  added: number
  changed: number
  removed: number
  nonChanged: number
}

export type EnvironmentData = Record<EntityType, EntityData>

export type EnvironmentScope = 'source' | 'target'

export type AffectedEntityData = {
  added: Array<string>
  removed: Array<string>
  maybeChanged: Array<Comparable>
  changed: Array<string>
}

export type AffectedKeys = keyof AffectedEntityData

export type AffectedEntities = Record<EntityType, AffectedEntityData>

export interface CreateChangesetContext extends BaseContext {
  sourceEnvironmentId: string
  targetEnvironmentId: string

  sourceData: EnvironmentData
  targetData: EnvironmentData

  affectedEntities: AffectedEntities

  changeset: Changeset

  statistics: Record<EntityType, EntityStatistics>

  limits: {
    all: number
    changed: number
    added: number
    removed: number
  }
}

export type SkipHandler = (context: CreateChangesetContext) => boolean
