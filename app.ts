import {
  bold,
  cyan,
  green,
  red,
  yellow,
} from 'https://deno.land/std@0.84.0/fmt/colors.ts'
import {
  Application,
  Context,
  HttpError,
  Router,
  RouterContext,
  Status
} from 'https://deno.land/x/oak@v6.2.0/mod.ts'
import { applyGraphQL, gql, GQLError } from 'https://deno.land/x/oak_graphql@0.6.2/mod.ts'
import { Bson, MongoClient } from 'https://deno.land/x/mongo@v0.22.0/mod.ts'
import { v4 } from 'https://deno.land/std@0.92.0/uuid/mod.ts'

const enums:any = {
  Status: {
    ACTIVE: 'active',
    DELETED: 'deleted'
  }
}

const app = new Application()

const client = new MongoClient()
await client.connect('mongodb://localhost:27017')

const db = client.database('test-record')
const recordsDB = db.collection('records')

// Error handler middleware
app.use(async (context, next) => {
  try {
    await next()
  } catch (e) {
    if (e instanceof HttpError) {
      // deno-lint-ignore no-explicit-any
      context.response.status = e.status as any
      if (e.expose) {
        context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${e.message}</h1>
              </body>
            </html>`
      } else {
        context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${Status[e.status]}</h1>
              </body>
            </html>`
      }
    } else if (e instanceof Error) {
      context.response.status = 500
      context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>500 - Internal Server Error</h1>
              </body>
            </html>`
      console.log('Unhandled Error:', red(bold(e.message)))
      console.log(e.stack)
    }
  }
})

// Logger
app.use(async (context, next) => {
  await next()
  const rt = context.response.headers.get('X-Response-Time')
  console.log(
    `${green(context.request.method)} ${cyan(context.request.url.pathname)} - ${
      bold(
        String(rt),
      )
    }`,
  )
})

// Response Time
app.use(async (context, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  context.response.headers.set('X-Response-Time', `${ms}ms`)
});

// ========== Oak-GraphQL ==========
const typeDefs: any = gql`
  type Record {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  input CreateRecordInput {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  input UpdateRecordInput {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  type Query {
    getRecords: [Record]
    getRecord(id: ID): Record
  }

  type Mutation {
    createRecord(input: CreateRecordInput): Record
    updateRecord(input: UpdateRecordInput): Record
    setRecordStatus(input: UpdateRecordInput): Record
  }
`

const resolvers = {
  Query: {
    getRecords: async () => {
      try {
        const allRecords = await recordsDB.find()

        return allRecords.map((r: any) => {
          const record: any = {
            id: r._id.toString(),
            createdAt: r.createdAt,
            description: r.description,
            status: r.status,
            updatedAt: r.updatedAt,
            url: r.url,
            username: r.username
          }

          return record
        })
      } catch (error) {
        console.log('--------Query getRecords error', error)
        throw new Error(error)
      }
    },

    getRecord: async (_: any, { id }: any, context: any, info: any) => {
      try {
        const record: any = await recordsDB.findOne({ _id: id })

        const result: any = {
          id: record._id.toString(),
          createdAt: record.createdAt,
          description: record.description,
          status: record.status,
          updatedAt: record.updatedAt,
          url: record.url,
          username: record.username
        }

        return result
      } catch (error) {
        console.log('--------Query getRecord error', error)
        throw new Error(error)
      }
    }
  },

  Mutation: {
    createRecord: async (_: any, { input: { description, url, username } }: any, context: any, info: any) => {
      try {
        const createRecordObj:any = {
          createdAt: new Date().toString(),
          description: description,
          status: enums.Status.ACTIVE,
          url: url,
          username: username
        }

        const insertId = await recordsDB.insertOne({
          _id: v4.generate(),
          ...createRecordObj
        })

        const result: any = {
          id: insertId,
          ...createRecordObj
        }

        console.log('--------createRecord result', result)

        return result
      } catch (error) {
        console.log('--------Mutation createRecord error', error)
        throw new Error(error)
      }
    },

    updateRecord: async (_: any, { input: { id, description, url } }: any, context: any, info: any) => {
      if (!v4.validate(id)) {
        throw new Error('Invalid id.')
      }

      try {
        const UpdateObj:any = {
          description: description,
          url: url
        }

        const { matchedCount, modifiedCount, upsertedId } = await recordsDB.updateOne(
          { _id: id },
          { $set: UpdateObj },
        )

        const result: any = {
          id: id,
          ...UpdateObj
        }

        console.log('--------updateRecord result', result)

        return result
      } catch (error) {
        console.log('--------Mutation updateRecord error', error)
        throw new Error(error)
      }
    },

    setRecordStatus: async (_: any, { input: {id, status} }: any, context: any, info: any) => {
      if (!v4.validate(id)) {
        throw new Error('The provided id is invalid.')
      }

      try {
        const UpdateObj:any = {
          status: status === enums.Status.ACTIVE ? enums.Status.DELETED : enums.Status.ACTIVE,
        }

        const { matchedCount, modifiedCount, upsertedId } = await recordsDB.updateOne(
          { _id: id },
          { $set: UpdateObj },
        )

        const result: any = {
          id: id,
          ...UpdateObj
        }

        console.log('--------setRecordStatus result', result)

        return result
      } catch (error) {
        console.log('--------Mutation setRecordStatus error', error)
        throw new Error(error)
      }
    }
  }
}

const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: typeDefs,
  resolvers: resolvers
})

app.use(GraphQLService.routes(), GraphQLService.allowedMethods())

// ========== cd to static folder and npm run build, then send static content ==========
// app.use(async (context) => {
//   await context.send({
//     root: `${Deno.cwd()}/record-static/build`,
//     index: 'index.html',
//   })
// })

app.addEventListener('listen', ({ hostname, port }) => {
  console.log(
    bold('Start listening on ') + yellow(`${hostname}:${port}`),
  )
})

await app.listen({ hostname: 'localhost', port: 8080 })
