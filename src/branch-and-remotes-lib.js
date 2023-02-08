import createError from 'http-errors'
import shell from 'shelljs'

const KNOWN_ORIGINS = ['origin', 'upstream']
const KNOWN_MAINS = ['main', 'master']

const determineCurrentBranch = ({ projectPath, reporter }) => {
  reporter?.push('Fetching current branch name...')
  const branchResult = shell.exec(`cd '${projectPath}' && git branch | grep '*' | cut -d' ' -f2`)
  if (branchResult.code !== 0) { throw createError.InternalServerError(`Could not determnie current branch for git repo at '${projectPath}'.`) }

  return branchResult.stdout.trim()
}

const determineOriginAndMain = ({ projectPath, reporter }) => {
  reporter?.push('Fetching latest origin data...')
  const fetchResult = shell.exec(`cd ${projectPath} && git fetch -p`)

  if (fetchResult.code !== 0) { throw createError(`'git fetch -p' failed at '${projectPath}': ${fetchResult.stderr}.`) }

  reporter?.push('Checking remote branches...')
  const remoteBranchQuery = shell.exec(`cd ${projectPath} && git branch -r`)
  if (remoteBranchQuery.code !== 0) throw createError(`Could not list remote branches: ${remoteBranchQuery.stderr}`)
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

export { determineCurrentBranch, determineOriginAndMain }
