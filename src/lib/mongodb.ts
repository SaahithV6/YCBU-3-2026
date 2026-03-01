import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

type GlobalWithMongo = typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> }
const g = globalThis as GlobalWithMongo

if (!uri) {
  console.warn('MONGODB_URI not set; MongoDB features disabled')
}

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    if (!g._mongoClientPromise) {
      client = new MongoClient(uri, options)
      g._mongoClientPromise = client.connect()
    }
    clientPromise = g._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
} else {
  clientPromise = Promise.reject(new Error('MONGODB_URI not configured'))
}

export async function getDb(dbName = 'living-papers'): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

export default clientPromise
