import createError from 'http-errors'
import shell from 'shelljs'

import { tryExec } from './lib/try-exec'

const KNOWN_ORIGINS = ['origin', 'upstream']
const KNOWN_MAINS = ['main', 'master']

const branchBaseName = () => {
  const now = new Date()
  const dateBit = now.getUTCFullYear()
    + (now.getUTCMonth() + '').padStart(2, '0')
    + (now.getUTCDate() + '').padStart(2, '0')
  const userId = shell.exec('git config user.email')
  if (userId.code !== 0) throw createError.InternalServerError('Failed to identify git user for branch name.')

  return dateBit + '-' + userId.stdout.trim()
}

const determineCurrentBranch = ({ projectPath, reporter }) => {
  reporter?.push('Fetching current branch name...')
  const branchResult = tryExec(`cd '${projectPath}' && git branch | grep '*' | cut -d' ' -f2`,
    { msg : `Could not determnie current branch for git repo at '${projectPath}'.` })

  return branchResult.stdout.trim()
}

const determineOriginAndMain = ({ projectPath, reporter }) => {
  reporter?.push('Fetching latest origin data...')
  tryExec(`cd ${projectPath} && git fetch -p`)

  reporter?.push('Checking remote branches...')
  const remoteBranchQuery = tryExec(`cd ${projectPath} && git branch -r`, { msg : 'Could not list remote branches.' })
  const remoteBranches = remoteBranchQuery.split('\n').map((r) => r.trim().split('/'))

  let origin, main
  for (const [remote, branch] of remoteBranches) {
    if (origin === undefined && KNOWN_ORIGINS.includes(remote)) {
      origin = remote
    }
    else if (origin !== undefined && origin !== remote && KNOWN_ORIGINS.includes(remote)) {
      throw createError(`Found multiple possible origin remotes: ${origin} + ${remote}`)
    }

    if (main === undefined && KNOWN_MAINS.includes(branch) && KNOWN_ORIGINS.includes(remote)) {
      main = branch
    }
    else if (main !== undefined && main !== branch && KNOWN_MAINS.includes(branch) && KNOWN_ORIGINS.includes(remote)) {
      throw createError(`Found multiple possible origin branches: ${main} + ${branch}`)
    }
  }

  reporter?.push(`Determined origin and main branch: ${origin}/${main}.`)

  return [origin, main]
}

const releaseBranchName = ({ releaseVersion }) => 'release-' + releaseVersion + '-' + branchBaseName()

export { branchBaseName, determineCurrentBranch, determineOriginAndMain, releaseBranchName }
