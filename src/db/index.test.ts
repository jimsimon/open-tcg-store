import { expect, test } from 'vitest'
import { db } from './index'
import { user } from './auth-schema'

test('database connection is established', async () => {
  // Test that we can execute a simple query
  const result = await db.select().from(user).limit(1)
  expect(Array.isArray(result)).toBe(true)
})

test('database can handle basic operations', async () => {
  // Test that we can perform a simple select query
  const result = await db.select().from(user).limit(1)
  expect(result).toBeDefined()
})