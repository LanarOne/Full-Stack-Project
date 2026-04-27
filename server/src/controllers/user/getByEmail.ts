import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import {userSchema} from "@server/entities/user.js";

export default authedProcedure
    .use(provideRepos({ userRepo }))
    .input(userSchema.pick({email:true}).strict())
    .query(async ({input:{email}, ctx }) => {


        const result = await ctx.repos.userRepo
            .inviteByEmail(email)
            .catch((error: unknown) =>
                handleKyselyErrors(error)
            )

        return result
    })
