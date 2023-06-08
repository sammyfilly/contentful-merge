import { Patch } from '@contentful/jsondiffpatch'
import { ListrTaskWrapper } from 'listr2'
import { createClient } from './client'
import { ResponseStatusCollector } from './client/response-status-collector'
import { ILogger } from './logger/types'

export type Client = ReturnType<typeof createClient>

export type ChangeSetChangeType = 'deleted' | 'added' | 'changed'
type ChangeSetItemType = 'Entry' | 'Asset' | 'ContentType' | 'EditorInterface'

export interface EntityLink {
  type: 'Link'
  linkType: ChangeSetItemType
  id: string
}

export type BaseChangeSetItem<T extends ChangeSetChangeType> = {
  changeType: T
}

export type ChangesetEntityLink = {
  entity: {
    sys: EntityLink
  }
}

export type DeletedChangeSetItem = BaseChangeSetItem<'deleted'> & ChangesetEntityLink

export type AddedChangeSetItem = BaseChangeSetItem<'added'> &
  ChangesetEntityLink & {
    data?: any
  }

export type ChangedChangeSetItem = BaseChangeSetItem<'changed'> &
  ChangesetEntityLink & {
    patch: Patch
  }

export type ChangeSetItem = DeletedChangeSetItem | AddedChangeSetItem | ChangedChangeSetItem

export type ChangeSet = {
  sys: {
    type: 'ChangeSet'
    version: 1
    createdAt: string
    entityType: ChangeSetItemType | 'Mixed'
    source: {
      sys: {
        type: 'Link'
        linkType: 'Environment'
        id: string
      }
    }
    target: {
      sys: {
        type: 'Link'
        linkType: 'Environment'
        id: string
      }
    }
  }
  items: Array<ChangeSetItem>
}

export interface BaseContext {
  client: Client
  logger: ILogger
  accessToken: string
  spaceId: string
  limit: number
}

export type BaseActionParams = {
  client: Client
  environmentId: string
  logger: ILogger
  responseCollector: ResponseStatusCollector
  task: ListrTaskWrapper<any, any>
}
