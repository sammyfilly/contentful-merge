import axios from 'axios'
import {Entry, EntryCollection} from 'contentful'
import {EntryProps} from 'contentful-management'
import {createHttpClient} from 'contentful-sdk-core'
import {pickBy} from 'lodash'
import {ClientLogHandler} from '../logger/types'
import {stripSys} from '../utils/strip-sys'

type CreateClientParams = {
  space: string, cdaToken: string, cmaToken: string,
  logHandler: ClientLogHandler,
}

type PageAbleParam = {
  skip?: number
  limit?: number
}

type ParamEnvironment = {
  environment: string
}

type EntriesQuery = {
  select?: Array<string>
}

type GetEntriesParams = ParamEnvironment & { query?: EntriesQuery & PageAbleParam & Record<string, any> }
type GetEntryParams = ParamEnvironment & { entryId: string, query?: EntriesQuery }
type DeleteEntryParams = ParamEnvironment & { entryId: string }
type CreateEntryParams = ParamEnvironment & { entryId: string, contentType: string, entry: Omit<EntryProps, 'sys'> }
type UpdateEntryParams = ParamEnvironment & { entryId: string, contentType: string, entry: EntryProps }
type PublishEntryParams = ParamEnvironment & { entryId: string, entry: EntryProps }

const cleanQuery = (query?: Record<string, any>) => pickBy(query, v => v !== undefined)

export const createClient = ({space, cdaToken, cmaToken, logHandler}: CreateClientParams) => {
  const cdaClient = createHttpClient(axios, {
    accessToken: cdaToken,
    space,
    throttle: 'auto',
    headers: {
      Authorization: `Bearer ${cdaToken}`,
      'Content-Type': 'application/vnd.contentful.delivery.v1+json',
    },
    baseURL: `https://cdn.contentful.com/spaces/${space}/environments/`,
    logHandler: (level, data) => logHandler(level, `CDA ${data}`),
  })

  const cmaClient = createHttpClient(axios, {
    accessToken: cmaToken,
    space,
    throttle: 'auto',
    headers: {
      Authorization: `Bearer ${cmaToken}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    baseURL: `https://api.contentful.com/spaces/${space}/environments/`,
    logHandler: (level, data) => logHandler(level, `CMA ${data}`),
  })

  const count = {
    cda: 0,
    cma: 0,
  }

  return {
    requestCounts: () => count,
    cma: {
      requestCounts: () => count.cma,
      entries: {
        getMany: async ({environment, query}: GetEntriesParams) => {
          count.cma++
          const result = await cmaClient.get(`${environment}/entries`, {
            params: {...cleanQuery(query)},
          })
          return result.data as EntryCollection<any>
        },
        get: async ({environment, entryId, query}: GetEntryParams) => {
          count.cma++
          const result = await cmaClient.get(`${environment}/entries/${entryId}`, {
            params: {...cleanQuery(query)},
          })
          return result.data as EntryProps<any>
        },
        unpublish: async ({environment, entryId}: DeleteEntryParams) => {
          count.cma++
          const result = await cmaClient.delete(`${environment}/entries/${entryId}/published`)
          return result.data as EntryProps<any>
        },
        delete: async ({environment, entryId}: DeleteEntryParams) => {
          count.cma++
          await cmaClient.delete(`${environment}/entries/${entryId}`)
        },
        create: async ({environment, entry, entryId, contentType}: CreateEntryParams) => {
          count.cma++
          const result = await cmaClient.put(`${environment}/entries/${entryId}`, stripSys(entry), {
            headers: {
              'X-Contentful-Content-Type': contentType,
            },
          })
          return result.data as EntryProps<any>
        },
        update: async ({environment, entry, entryId}: UpdateEntryParams) => {
          count.cma++
          const result = await cmaClient.put(`${environment}/entries/${entryId}`, entry, {
            headers: {
              'X-Contentful-Version': entry.sys.version,
            },
          })
          return result.data as EntryProps<any>
        },
        publish: async ({environment, entry, entryId}: PublishEntryParams) => {
          count.cma++
          return cmaClient.put(`${environment}/entries/${entryId}/published`, entry, {
            headers: {
              'X-Contentful-Version': entry.sys.version,
            },
          })
        },
      },
    },
    cda: {
      requestCounts: () => count.cda,
      entries: {
        getMany: async ({environment, query}: GetEntriesParams) => {
          count.cda++
          const result = await cdaClient.get(`${environment}/entries`, {
            params: {...cleanQuery(query)},
          })
          return result.data as EntryCollection<any>
        },
        get: async ({environment, entryId, query}: GetEntryParams) => {
          count.cda++
          const result = await cdaClient.get(`${environment}/entries/${entryId}`, {
            params: {...cleanQuery(query)},
          })
          return result.data as Entry<any>
        },
      },
    },
  }
}
