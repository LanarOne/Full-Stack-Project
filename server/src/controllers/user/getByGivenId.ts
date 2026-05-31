import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import {userSchema} from "@server/entities/user.js";

export default authedProcedure
    .use(provideRepos({ userRepo }))
    .input(userSchema.pick({id:true}).strict())
    .query(async ({input:{id}, ctx }) => {


        const result = await ctx.repos.userRepo
            .findById(id)
            .catch((error: unknown) =>
                handleKyselyErrors(error)
            )

        return result
    })
