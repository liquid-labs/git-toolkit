import createError from 'http-errors'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineOriginAndMain, hasBranch } from './branch-and-remotes-lib'

const compareLocalAndRemoteBranch = ({ branch, remote, projectPath, reporter }) => {
  if (!hasBranch({ branch, projectPath, reporter })) { throw createError.NotFound(`No such local branch '${branch}' found.`) }

  const remoteBranch = `${remote}/${branch}`
  if (!hasBranch({ branch : remoteBranch, projectPath, reporter })) { throw createError.NotFound(`No such remote branch '${remoteBranch}' found.`) }

  const lcrResult = tryExec(`cd '${projectPath}' && git branch -a --contains ${remote}/${branch} ${branch}`)
  const localContainsRemote = lcrResult.stdout.length > 0

  const rclResult = tryExec(`cd '${projectPath}' && git branch -a --contains ${branch} ${remote}/${branch}`)
  const remoteContainsLocal = rclResult.stdout.length > 0

  if (localContainsRemote === false && remoteContainsLocal === false) {
    return 'mixed'
  }
  else if (localContainsRemote === true && remoteContainsLocal === true) {
    return 'synced'
  }
  else if (localContainsRemote === true) { // && remoteContainsLocal === false
    return 'local ahead'
  }
  else { // localContainsRemote === false && remoteContainsLocal === true
    return 'local behind'
  }
}

const determineIfUncommittedChanges = ({ projectPath, reporter }) => {
  reporter?.push(`Checking for uncommitted changes at ${projectPath}...`)
  // will exit with 1 if both these commands exit with 1 normally if there are changes
  tryExec(`cd '${projectPath}' && git update-index --refresh`, { noThrow : true })
  const hasChanges =
    tryExec(`cd '${projectPath}' && git status --porcelain=v1 | grep -E '^(A|D|M)'`, { noThrow : true })
      .stdout.length > 0

  return hasChanges
}

const determineIfUnstagedChanges = ({ projectPath, reporter }) => {
  reporter?.push(`Checking for non-staged changes at ${projectPath}...`)
  // will exit with 1 if both these commands exit with 1 normally if there are changes
  tryExec(`cd '${projectPath}' && git update-index -q --ignore-submodules --refresh`, { noThrow : true })
  const hasChanges =
    tryExec(`cd '${projectPath}' && git status --porcelain=v1 | grep -E '^([?]{2}| D| M)'`, { noThrow : true }).stdout.length > 0

  return hasChanges
}

const verifyBranchInSync = ({ branch, description, projectPath, remote, reporter }) => {
  if (description !== undefined) description += ' '

  // Update local branch so we can check we're in sync
  reporter?.push(`Fetching ${remote} ${branch}...`)
  tryExec(`cd '${projectPath}' && git fetch -q ${remote} ${branch}`,
    { msg : `Could not update ${description}branch ${remote}/${branch}.` })

  reporter?.push('Checking local and remote versions...')
  const originHead = tryExec(`cd '${projectPath}' && git rev-parse ${remote}/${branch}`,
    { msg : `Could not determnie version for ${description}branch ${remote}/${branch} HEAD.` })
  const localHead = tryExec(`cd '${projectPath}' && git rev-parse ${branch}`,
    { msg : `Could not determnie version for local ${description}branch ${branch} HEAD.` })

  if (originHead.stdout !== localHead.stdout) {
    throw createError.BadRequest(`Local and ${remote} ${branch} ${description}branches are not in sync. Try:\n\ngit fetch ${remote} ${branch} \\\n  && git merge ${remote}/${branch}\\\n  && git push ${remote} ${branch}`)
  }
}

/**
 * Verifies the current branch is clean.
 */
const verifyClean = ({ projectPath, reporter }) => {
  reporter?.push('Checking working directory is clean...')
  const cleanResult = tryExec(`cd '${projectPath}' && git status --porcelain`,
    { msg : `Could not execute 'git status' in dir '${projectPath}'.` })
  if (cleanResult.stdout.length > 0) { throw createError.BadRequest(`git repo at '${projectPath}' is not clean.`) }
}

const verifyLocalChangesSaved = ({ branch, origin, projectPath, reporter }) => {
  if (origin === undefined) {
    ([origin] = determineOriginAndMain({ projectPath, reporter }))
  }

  tryExec(`cd '${projectPath}' && git merge-base --is-ancestor ${branch} ${origin}/${branch}`,
    { msg : `Local ${branch} is not found in ${origin}/${branch}.` })
}

const verifyMainBranchUpToDate = ({ projectPath, reporter }) => {
  const [originRemote, mainBranch] = determineOriginAndMain({ projectPath })

  verifyBranchInSync({ branch : mainBranch, description : 'main', projectPath, remote : originRemote, reporter })
}

export {
  compareLocalAndRemoteBranch,
  determineIfUncommittedChanges,
  determineIfUnstagedChanges,
  verifyBranchInSync,
  verifyClean,
  verifyLocalChangesSaved,
  verifyMainBranchUpToDate
}
