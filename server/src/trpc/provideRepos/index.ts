import type {
  Repositories,
  RepositoriesFactories,
  RepositoriesKeys,
} from '@server/repositories/index.js'
import { middleware } from '../index.js'

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

const none: Partial<Repositories> = {}

export default function provideRepos<
  TKeys extends RepositoriesKeys,
>(
  reposFactoriesWanted: Pick<
    RepositoriesFactories,
    TKeys
  >
) {
  return middleware(({ ctx, next }) => {
    const reposAlreadyProvided = ctx.repos || none

    const reposWantedTuples = Object.entries(
      reposFactoriesWanted
    ) as Entries<
      Pick<RepositoriesFactories, TKeys>
    >

    const reposWanted = Object.fromEntries(
      reposWantedTuples.map(
        ([key, repoFactory]) => [
          key,
          reposAlreadyProvided[key] ||
            repoFactory(ctx.db),
        ]
      )
    ) as Pick<Repositories, TKeys>
    return next({
      ctx: {
        repos: {
          ...reposAlreadyProvided,
          ...reposWanted,
        },
      },
    })
  })
}
