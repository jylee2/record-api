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
import {
  applyGraphQL,
  gql,
  GQLError
} from 'https://deno.land/x/oak_graphql@0.6.2/mod.ts'
import {
  Bson,
  MongoClient
} from 'https://deno.land/x/mongo@v0.22.0/mod.ts'
import { v4 } from 'https://deno.land/std@0.92.0/uuid/mod.ts'

const app = new Application()

// =======================================================

const client = new MongoClient()
await client.connect('mongodb://localhost:27017')
// await client.connect({
//   db: 'recordOne',
//   tls: true,
//   servers: [
//     {
//       host: 'cluster0-shard-00-02.cwxbw.mongodb.net',
//       port: 27017,
//     }
//   ],
//   credential: {
//     username: 'jylee4',
//     password: 'hellomoto123',
//     db: 'recordOne',
//     mechanism: "SCRAM-SHA-1"
//   }
// })
// client.connectWithUri('mongodb://localhost:27017')

const db = client.database('test-record')
const dogs = db.collection('dogs')
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

// ========== MongoDB Atlas ==========
// async function connect(): Promise<Collection<IGistSchema>> {
//   const client = new MongoClient()
//   await client.connect({
//     db: 'recordOne',
//     tls: true,
//     servers: [
//       {
//         host: 'cluster0-shard-00-02.cwxbw.mongodb.net',
//         port: 8000,
//       }
//     ],
//     credential: {
//       username: "<user>",
//       password: "<password>",
//       db: 'recordOne',
//       mechanism: "SCRAM-SHA-1"
//     }
//   })
//   return client.database('gist_api').collection<IGistSchema>('gists')

// }
// export async function insertGist(gist: any): Promise<string> {
//   const collection = await connect()
//   return (await collection.insertOne(gist)).toString()
// }
// cluster0-shard-00-02.cwxbw.mongodb.net

// ========== UUID ==========
const myUUID = v4.generate()
// console.log('--------myUUID', myUUID)
const isValidUUID = v4.validate(myUUID)
// console.log('--------isValid', isValid)

// ========== Oak-GraphQL ==========

const typeDefs: any = gql`
  type Record {
    id: ID!
    description: String
    status: String
    url: String!
  }

  input RecordInput {
    description: String
    status: String
    url: String!
  }

  input RecordUpdate {
    id: ID!
    description: String
    status: String
    url: String!
  }

  type Query {
    records: [Record!]!
    getRecord(id: ID!): Record
  }

  type Mutation {
    createRecord(input: RecordInput): Record!
    updateRecord(input: RecordUpdate): Record!
    setRecordStatus(input: RecordUpdate): Record!
  }
`

const resolvers = {
  Query: {
    records: async () => {
      try {
        const allRecords = await recordsDB.find()

        return allRecords.map((r: any) => {
          const record: any = {
            id: r._id.toString(),
            description: r.description,
            status: r.status,
            url: r.url
          }

          return record
        })
      } catch (error) {
        console.log('--------Query records error.message', error.message)
        return error.message
      }
    },

    getRecord: async (_: any, { id }: any, context: any, info: any) => {
      try {
        const record: any = await recordsDB.findOne({ _id: id })

        const result: any = {
          id: record._id.toString(),
          description: record.description,
          status: record.status,
          url: record.url
        }

        return result
      } catch (error) {
        console.log('--------Query getRecord error.message', error.message)
        return error.message
      }
    }
  },

  Mutation: {
    createRecord: async (_: any, { input: {description, url} }: any, context: any, info: any) => {
      try {
        const enumStatus = 'active'

        const insertId = await recordsDB.insertOne({
          _id: v4.generate(),
          description: description,
          status: enumStatus,
          url: url
        })
        console.log('--------insertId', insertId)

        const result: any = {
          id: insertId,
          description: description,
          status: enumStatus,
          url: url
        }

        return result
      } catch (error) {
        console.log('--------Mutation createRecord error.message', error.message)
        return error.message
      }
    },

    updateRecord: async (_: any, { input: {id, description, url} }: any, context: any, info: any) => {
      try {
        const { matchedCount, modifiedCount, upsertedId } = await recordsDB.updateOne(
          { _id: id },
          { $set: {
            description: description,
            url: url
          } },
        )

        const result: any = {
          id: id,
          description: description,
          url: url
        }
        console.log('--------result', result)

        return result
      } catch (error) {
        console.log('--------Mutation updateRecord error.message', error.message)
        return error.message
      }
    },

    setRecordStatus: async (_: any, { input: {id, description, status, url} }: any, context: any, info: any) => {
      try {
        const newStatus = status === 'active' ? 'deleted' : 'active'

        const { matchedCount, modifiedCount, upsertedId } = await recordsDB.updateOne(
          { _id: id },
          { $set: {
            description: description,
            status: newStatus,
            url: url
          } },
        )

        const result: any = {
          id: id,
          description: description,
          status: newStatus,
          url: url
        }
        console.log('--------result', result)

        return result
      } catch (error) {
        console.log('--------Mutation setRecordStatus error.message', error.message)
        return error.message
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
