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

import typeDefs from './graphql/typeDefs.ts'
import resolvers from './graphql/resolvers.ts'

const app = new Application()

const client = new MongoClient()
await client.connect('mongodb://localhost:27017')

// const db = client.database('test-record')
// const RecordsDB = db.collection('records')
// const UsersDB = db.collection('users')

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



const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: (context:any) => context
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
