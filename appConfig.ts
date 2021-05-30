import 'https://deno.land/x/dotenv@v2.0.0/load.ts'
import { load } from './dependencies.ts'

load([
  'JWT_SECRET_KEY',
  'PORT',
  'FRONT_END_PORTS',
  'MONGODB_PORT',
  'MONGO_HOST',
  'MONGO_USERNAME',
  'MONGO_PASSWORD'
])

const PORT = (Deno.env.get('PORT') && Number(Deno.env.get('PORT')) === 8080) ? Number(Deno.env.get('PORT')) : Deno.env.get('PORT')

const appConfig:any = {
  JWT_SECRET_KEY: Deno.env.get('JWT_SECRET_KEY'),
  FRONT_END_PORTS: Deno.env.get('FRONT_END_PORTS'),
  SERVER_PORT: PORT,
  MONGODB_PORT: Deno.env.get('MONGODB_PORT'),
  MONGO_HOST: Deno.env.get('MONGO_HOST'),
  MONGO_USERNAME: Deno.env.get('MONGO_USERNAME'),
  MONGO_PASSWORD:Deno.env.get('MONGO_PASSWORD')
}

export default appConfig