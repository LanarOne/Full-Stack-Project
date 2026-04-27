import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import { fakeUser } from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
    authContext,
    requestContext,
} from '@server/tests/utils/context.js'
import userRouter from '../index.js'

const db = await wrapInRollbacks(
    createTestDatabase()
)

const createCaller =
    createCallerFactory(userRouter)

const [user, otherUser] = await insertAll(db, 'user', [
    fakeUser({ email: 'random@email.com' }),
    fakeUser({ email: 'totocaca@email.com' }),
])

describe('User getByGivenId controller', () => {
    it('should throw if the user is not logged in', async () => {
        const { getByGivenId } = createCaller(
            requestContext({ db })
        )

        await expect(getByGivenId({id:otherUser.id})).rejects.toThrow(
            expect.objectContaining({
                message: 'Unauthenticated. Please log in',
            })
        )
    })

    it('should throw if there is no record for the userId in the database', async () => {
        const { getByGivenId } = createCaller(
            authContext(
                { db },
                { id: user.id, email: user.email }
            )
        )

        await expect(getByGivenId({id:1312})).rejects.toThrow(
            expect.objectContaining({
                code: 'NOT_FOUND',
                name: 'TRPCError',
            })
        )
    })

    const { getByGivenId } = createCaller(
        authContext(
            { db },
            { id: user.id, email: user.email }
        )
    )

    it('should get a user by ID correctly', async () => {
        await expect(getByGivenId({id:otherUser.id})).resolves.toEqual(
            expect.objectContaining({
                name: otherUser.name,
                profilePicture: otherUser.profilePicture,
            })
        )
    })
})
