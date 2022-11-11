import {ListrTask} from 'listr2'
import pLimit from 'p-limit'
import {LogLevel} from '../../logger/types'
import {AddedChangeSetItem} from '../../types'
import {createEntity} from '../actions/create-entity'
import {ApplyChangesetContext} from '../types'

export const createAddEntitiesTask = (): ListrTask => {
  return {
    title: 'Add entities',
    task: async (context: ApplyChangesetContext, task) => {
      const {client, changeSet, environmentId, logger, responseCollector} = context
      logger.log(LogLevel.INFO, 'Start createAddEntitiesTask')
      const entries = changeSet.items.filter(item => item.changeType === 'added') as AddedChangeSetItem[]
      const entityCount = entries.length

      task.title = `Add ${entityCount} entities`

      let count = 0

      const limiter = pLimit(10)

      await Promise.all(entries.map(async item => {
        return limiter(async () => {
          await createEntity({client, environmentId, logger, item, responseCollector, task})
          task.title = `Added ${++count}/${entityCount} entities (failed: ${responseCollector.errorsLength})`
        })
      }),
      )
    },
  }
}